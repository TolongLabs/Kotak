#!/usr/bin/env bash
# Renders the final demo segment, its captions and the H1 clip, then checks them. Stops at the first failure.
# Needs bun, ffmpeg, jq and awk. Outputs: out/kotak-demo.mp4, out/kotak-demo.srt, out/h1.mp4.
set -euo pipefail
cd "$(dirname "$0")/.."
bunx tsc --noEmit
bun -e "import { placeholders } from './src/lib'; const p = placeholders(); if (p.length) { console.error('Placeholders still in the edit: ' + p.join(', ')); process.exit(1) }"
mkdir -p out
bunx remotion render src/index.ts Demo out/raw-demo.mp4 --codec=h264 --crf=16 --audio-bitrate=320k
bunx remotion render src/index.ts H1 out/h1.mp4 --codec=h264 --crf=16 --muted

# Loudness in three passes: measure; gain to -13 LUFS and catch peaks with a 4x-oversampled limiter at -2 dBFS;
# then a linear loudnorm to -14 LUFS with the measurements fed back. The video stream is copied.
json() { sed -n '/^{/,/^}/p'; } # loudnorm prints its JSON among other lines on stderr
in=out/raw-demo.mp4 outf=out/kotak-demo.mp4
i0=$(ffmpeg -hide_banner -nostats -i "$in" -af loudnorm=print_format=json -f null - 2>&1 | json | jq -r .input_i)
pre="volume=$(awk "BEGIN{print -13 - $i0}")dB,aresample=192000,alimiter=limit=0.794:attack=1:release=60:level=disabled,aresample=48000"
m=$(ffmpeg -hide_banner -nostats -i "$in" -af "$pre,loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1 | json)
t=$(ffmpeg -hide_banner -nostats -y -i "$in" -c:v copy \
  -af "$pre,loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(jq -r .input_i <<<"$m"):measured_TP=$(jq -r .input_tp <<<"$m"):measured_LRA=$(jq -r .input_lra <<<"$m"):measured_thresh=$(jq -r .input_thresh <<<"$m"):offset=$(jq -r .target_offset <<<"$m"):linear=true:print_format=json,aresample=48000" \
  -c:a aac -b:a 320k "$outf" 2>&1 | json | jq -r .normalization_type)
[ "$t" = linear ] || { echo "$outf: loudnorm fell back to $t" >&2; exit 1; }

bun scripts/captions.ts > out/kotak-demo.srt
bun scripts/qa.ts out/kotak-demo.mp4 out/kotak-demo.srt out/h1.mp4
