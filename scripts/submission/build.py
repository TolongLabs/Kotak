# /// script
# requires-python = ">=3.12"
# dependencies = ["pikepdf>=9"]
# ///
"""Builds submission/SDC2026_T010NG_Preliminary.pdf and SDC2026_T010NG_TechDeclaration.pdf on the organisers' PDF
templates, and SDC2026_T010NG_UpdatedPRD.pdf and SDC2026_T010NG_Final.pdf on pages of the proposal template, since
neither has a PDF template of its own.

Each <section class="page"> in proposal.html and declaration.html is one output page: Chrome prints the answers as a
transparent overlay, and this script lays it over a page of the organisers' Canva template. data-base names the
template page underneath. data-strip lists regions to clear from it first, as "kind x0 y0 x1 y1" in points from the
top-left, where kind is "text" (clear text only), "all" (clear text, shapes and images) or "erase" (make the pixels of a thin
image strip transparent, such as the cover's baked-in text shadows). That is how continuation
pages reuse a template page's background and heading without its prompt and box. data-append adds every page of
another PDF after the page. Page numbers follow the physical page, so the overlay draws them.

Run: bun run build:submission   (set CHROME to use another Chrome or Chromium binary)
"""

import hashlib
import os
import re
import subprocess
import tempfile
import urllib.request
from pathlib import Path

import pikepdf
from pikepdf import Name, Operator

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
CHROME = os.environ.get("CHROME", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
CACHE = Path(tempfile.gettempdir()) / "sdc-templates"
# The organisers' Drive folder "2. Template for docs inside GitHub Rep", PDF versions.
TEMPLATES = {
    "proposal": "1jNjuMJfhMYjo3qQw_PmmeGM-INEwuleo",
    "declaration": "1LBXfXrFblX-dHanSP8jhUOMGfGGxY2ew",
}
OUTPUTS = {
    "proposal": "SDC2026_T010NG_Preliminary.pdf",
    "declaration": "SDC2026_T010NG_TechDeclaration.pdf",
    "updated-prd": "SDC2026_T010NG_UpdatedPRD.pdf",
    "final-report": "SDC2026_T010NG_Final.pdf",
}
PAINT = {"f", "F", "f*", "S", "s", "B", "B*", "b", "b*"}
SHOW = {"Tj", "TJ", "'", '"'}


def template(name):
    path = CACHE / f"{name}.pdf"
    if not path.exists():
        CACHE.mkdir(exist_ok=True)
        url = f"https://drive.usercontent.google.com/download?id={TEMPLATES[name]}&export=download&confirm=t"
        urllib.request.urlretrieve(url, path)
    return pikepdf.open(path)


def chrome(*args):
    with tempfile.TemporaryDirectory() as profile:
        flags = [CHROME, "--headless", f"--user-data-dir={profile}", "--virtual-time-budget=20000", *args]
        return subprocess.run(flags, check=True, capture_output=True, text=True).stdout


def overlay(name, out):
    url = (HERE / f"{name}.html").as_uri()
    clipped = re.findall(r'<(\w+) class="([^"]+)"[^>]*data-overflow="(\d+)"', chrome("--dump-dom", url))
    if clipped:
        raise SystemExit(f"{name}: text overflows on template page(s) " + ", ".join(f"{b} ({c})" for _, c, b in clipped))
    chrome("--no-pdf-header-footer", f"--print-to-pdf={out}", url)
    return pikepdf.open(out)


def specs(name):
    html = (HERE / f"{name}.html").read_text()
    pages = []
    for tag in re.findall(r'<section\s+class="page[^"]*"([^>]*)>', html):
        attrs = dict(re.findall(r'data-([a-z]+)="([^"]*)"', tag))
        strip = [(kind, *map(float, box)) for kind, *box in
                 (part.split() for part in attrs.get("strip", "").split(";") if part.strip())]
        pages.append({"base": int(attrs["base"]), "strip": strip, "append": attrs.get("append")})
    return pages


def mul(a, b):
    """Multiplies two PDF matrices [a b c d e f], applying a first."""
    return [a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3], a[2] * b[0] + a[3] * b[2],
            a[2] * b[1] + a[3] * b[3], a[4] * b[0] + a[5] * b[2] + b[4], a[4] * b[1] + a[5] * b[3] + b[5]]


def apply(m, x, y):
    return x * m[0] + y * m[2] + m[4], x * m[1] + y * m[3] + m[5]


def form_ctm(page):
    """Finds the page's one Form XObject and the matrix it is drawn with."""
    ctm, stack = [1, 0, 0, 1, 0, 0], []
    for operands, op in pikepdf.parse_content_stream(page):
        op = str(op)
        if op == "q":
            stack.append(ctm)
        elif op == "Q":
            ctm = stack.pop()
        elif op == "cm":
            ctm = mul([float(v) for v in operands], ctm)
        elif op == "Do":
            form = page.Resources.XObject[operands[0]]
            if form.get("/Subtype") == "/Form":
                matrix = [float(v) for v in form.get("/Matrix", [1, 0, 0, 1, 0, 0])]
                return operands[0], form, mul(matrix, ctm)
    raise ValueError("page draws no Form XObject")


def strip(pdf, page, regions):
    """Rewrites the page's Form XObject without what it draws inside the regions."""
    if not regions:
        return
    name, form, start = form_ctm(page)
    box = [float(v) for v in page.MediaBox]

    def corners(*points):
        return [(x - box[0], box[3] - y) for x, y in zip(points[::2], points[1::2])]

    def hit(kinds, *points):
        return any(k in kinds and all(x0 <= x <= x1 and y0 <= y <= y1 for x, y in corners(*points))
                   for k, x0, y0, x1, y1 in regions)

    def touches(*points):
        xs, ys = zip(*corners(*points))
        return any(min(xs) <= x1 and max(xs) >= x0 and min(ys) <= y1 and max(ys) >= y0 for _, x0, y0, x1, y1 in regions)

    def erase(image, ctm):
        """Returns a copy of the image with its soft mask cleared inside "erase" regions, or None if none apply. Only an
        image strip within 60 pt above and below a region counts, like the cover's baked text shadows, so full-page
        backgrounds that cross it stay whole."""
        (x0, y0), (x1, y1) = corners(*apply(ctm, 0, 1), *apply(ctm, 1, 0))
        boxes = [r for r in regions if r[0] == "erase" and y0 >= r[2] - 60 and y1 <= r[4] + 60]
        if not boxes or "/SMask" not in image:
            return None
        w, h = int(image.Width), int(image.Height)
        mask = bytearray(image.SMask.read_bytes())
        for _, rx0, ry0, rx1, ry1 in boxes:
            c0, c1 = max(0, int((rx0 - x0) / (x1 - x0) * w)), min(w, int((rx1 - x0) / (x1 - x0) * w) + 1)
            r0, r1 = max(0, int((ry0 - y0) / (y1 - y0) * h)), min(h, int((ry1 - y0) / (y1 - y0) * h) + 1)
            for r in range(r0, r1):
                if c0 < c1:
                    mask[r * w + c0:r * w + c1] = bytes(c1 - c0)
        smask = pdf.make_stream(bytes(mask))
        for key, value in image.SMask.items():
            if key not in ("/Length", "/Filter", "/DecodeParms"):
                smask[key] = value
        copy = pdf.make_stream(image.read_raw_bytes())
        for key, value in image.items():
            if key != "/Length":
                copy[key] = value
        copy.SMask = smask
        return copy

    def rewrite(form, start):
        ctm, stack, tm, path = start, [], [1, 0, 0, 1, 0, 0], None
        resources = pikepdf.Dictionary(form.get("/Resources", pikepdf.Dictionary()))
        if "/XObject" in resources:
            resources.XObject = pikepdf.Dictionary(resources.XObject)
        kept = []
        for operands, op in pikepdf.parse_content_stream(form):
            o = str(op)
            if o == "q":
                stack.append(ctm)
            elif o == "Q":
                ctm = stack.pop()
            elif o == "cm":
                ctm = mul([float(v) for v in operands], ctm)
            elif o == "BT":
                tm = [1, 0, 0, 1, 0, 0]
            elif o == "Tm":
                tm = [float(v) for v in operands]
            elif o in ("Td", "TD"):
                tm = mul([1, 0, 0, 1, float(operands[0]), float(operands[1])], tm)
            elif o in ("m", "re") and path is None:
                path = (float(operands[0]), float(operands[1]))
            elif o in SHOW and hit(("text", "all"), *apply(mul(tm, ctm), 0, 0)):
                continue
            elif o == "Do":
                child = resources.XObject[operands[0]]
                bbox = [float(v) for v in child.get("/BBox", [0, 0, 0, 0])]
                edges = (*apply(ctm, bbox[0], bbox[1]), *apply(ctm, bbox[2], bbox[3]))
                # Only what lies wholly inside a region goes, so the full-page background survives. Text nested in a
                # form (some page digits, the cover's lines) goes with a "text" region; a form that only crosses a
                # region is rewritten in turn.
                if hit(("text", "all") if b"BT" in child.read_bytes() else ("all",), *edges):
                    continue
                if child.get("/Subtype") == "/Image" and touches(*apply(ctm, 0, 0), *apply(ctm, 1, 1)):
                    erased = erase(child, ctm)
                    if erased is not None:
                        resources.XObject[operands[0]] = erased
                if child.get("/Subtype") == "/Form" and touches(*edges):
                    matrix = [float(v) for v in child.get("/Matrix", [1, 0, 0, 1, 0, 0])]
                    resources.XObject[operands[0]] = rewrite(child, mul(matrix, ctm))
            elif o in PAINT or o == "n":
                if o != "n" and path is not None and hit(("all",), *apply(ctm, *path)):
                    operands, op = [], Operator("n")
                path = None
            kept.append((operands, op))

        copy = pdf.make_stream(pikepdf.unparse_content_stream(kept))
        for key, value in form.items():
            if key not in ("/Length", "/Filter", "/DecodeParms", "/Resources"):
                copy[key] = value
        copy.Resources = resources
        return copy

    page.Resources.XObject[name] = rewrite(form, start)


def detach(pdf, page):
    """Gives a copied template page its own contents and resources: copies of one template page share them."""
    page.obj.Contents = pdf.make_stream(page.obj.Contents.read_bytes())
    page.obj.Resources = pikepdf.Dictionary(page.obj.Resources)
    page.obj.Resources.XObject = pikepdf.Dictionary(page.obj.Resources.XObject)
    if "/StructParents" in page.obj:
        del page.obj["/StructParents"]


def lay(pdf, page, sheet):
    """Draws an overlay page over the page and moves its links across."""
    box = [float(v) for v in page.MediaBox]
    page.add_overlay(sheet, pikepdf.Rectangle(*box))
    for annot in sheet.obj.get("/Annots", []):
        link = pdf.copy_foreign(annot)
        if "/P" in link:
            del link["/P"]
        r = [float(v) for v in link.Rect]
        link.Rect = [r[0] + box[0], r[1] + box[1], r[2] + box[0], r[3] + box[1]]
        if "/QuadPoints" in link:
            del link["/QuadPoints"]
        if "/Annots" not in page.obj:
            page.obj.Annots = pdf.make_indirect(pikepdf.Array())
        page.obj.Annots.append(link)


def dedupe(pdf):
    """Points every repeated image at one copy; the Canva templates embed the same backgrounds on every page."""
    canonical, alias = {}, {}
    for pass_ in ("mask", "image"):
        for obj in pdf.objects:
            if not isinstance(obj, pikepdf.Stream) or obj.get("/Subtype") != "/Image":
                continue
            if (pass_ == "mask") == ("/SMask" in obj):
                continue
            smask = obj.get("/SMask")
            mask_key = alias.get(smask.objgen, smask.objgen) if smask is not None else None
            key = (hashlib.sha1(obj.read_raw_bytes()).hexdigest(), repr(mask_key), int(obj.Width), int(obj.Height))
            first = canonical.setdefault(key, obj)
            if first.objgen != obj.objgen:
                alias[obj.objgen] = first.objgen
            if smask is not None and smask.objgen in alias:
                obj.SMask = pdf.get_object(alias[smask.objgen])

    seen = set()

    def walk(resources):
        xobjects = resources.get("/XObject") if resources is not None else None
        if xobjects is None:
            return
        for key in list(xobjects.keys()):
            child = xobjects[key]
            if child.objgen in alias:
                xobjects[key] = pdf.get_object(alias[child.objgen])
            elif child.get("/Subtype") == "/Form" and child.objgen not in seen:
                seen.add(child.objgen)
                walk(child.get("/Resources"))

    for page in pdf.pages:
        walk(page.get("/Resources"))


def append_pages(pdf, name, template_name):
    tpl = template(template_name)
    with tempfile.TemporaryDirectory() as tmp:
        sheets = overlay(name, Path(tmp) / "overlay.pdf")
        pages = specs(name)
        if len(sheets.pages) != len(pages):
            raise SystemExit(f"{name}: overlay has {len(sheets.pages)} pages for {len(pages)} sections")
        for spec, sheet in zip(pages, sheets.pages):
            # copy_foreign caches, so a template page used twice needs its own page dictionary.
            source = pdf.copy_foreign(tpl.pages[spec["base"] - 1].obj)
            pdf.pages.append(pikepdf.Page(pdf.make_indirect(pikepdf.Dictionary(source))))
            page = pdf.pages[-1]
            detach(pdf, page)
            strip(pdf, page, spec["strip"])
            lay(pdf, page, sheet)
            if spec["append"]:
                with pikepdf.open(ROOT / spec["append"]) as extra:
                    pdf.pages.extend(extra.pages)
        # Windows can't delete the temporary overlay while pikepdf still has it open.
        sheets.close()


def build(name):
    pdf = pikepdf.new()
    append_pages(pdf, name, name)
    dedupe(pdf)
    pdf.docinfo.Title = {"proposal": "Phase 1: Preliminary Project Proposal",
                         "declaration": "Technical Tools Declaration"}[name] + ", Kotak (Team T010NG)"
    out = ROOT / "submission" / OUTPUTS[name]
    pdf.save(out, compress_streams=True, object_stream_mode=pikepdf.ObjectStreamMode.generate)
    print(f"wrote submission/{OUTPUTS[name]} ({len(pdf.pages)} pages, {out.stat().st_size // 1024} KB)")


def build_updated_prd():
    pdf = pikepdf.new()
    append_pages(pdf, "proposal", "proposal")
    append_pages(pdf, "updated-prd", "proposal")
    dedupe(pdf)
    pdf.docinfo.Title = "Updated PRD, Kotak (Team T010NG)"
    out = ROOT / "submission" / OUTPUTS["updated-prd"]
    pdf.save(out, compress_streams=True, object_stream_mode=pikepdf.ObjectStreamMode.generate)
    print(f"wrote submission/{OUTPUTS['updated-prd']} ({len(pdf.pages)} pages, {out.stat().st_size // 1024} KB)")


def build_final_report():
    pdf = pikepdf.new()
    append_pages(pdf, "final-report", "proposal")
    dedupe(pdf)
    pdf.docinfo.Title = "Phase 2: Final Project & Prototype Report, Kotak (Team T010NG)"
    out = ROOT / "submission" / OUTPUTS["final-report"]
    pdf.save(out, compress_streams=True, object_stream_mode=pikepdf.ObjectStreamMode.generate)
    print(f"wrote submission/{OUTPUTS['final-report']} ({len(pdf.pages)} pages, {out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("target", choices=("all", "proposal", "declaration", "updated-prd", "final-report"), default="all", nargs="?")
    target = parser.parse_args().target
    if target == "updated-prd":
        build_updated_prd()
    elif target == "final-report":
        build_final_report()
    elif target == "all":
        for name in TEMPLATES:
            build(name)
        build_final_report()
    else:
        build(target)
