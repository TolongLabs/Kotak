import { availableParallelism, totalmem } from 'node:os'

export interface Machine {
  cores: number
  // navigator.deviceMemory: GiB rounded down to a power of two, capped at 8 as Chrome does.
  memory: number
  // Primary screen and work area in CSS pixels, as a browser on this machine reports them.
  screen: { width: number; height: number; availWidth: number; availHeight: number; pixelRatio: number } | null
}

const SCRIPT = [
  'Add-Type -AssemblyName System.Windows.Forms',
  '$p = [System.Windows.Forms.Screen]::PrimaryScreen',
  "$dpi = (Get-ItemProperty 'HKCU:\\Control Panel\\Desktop\\WindowMetrics' -Name AppliedDPI -ErrorAction SilentlyContinue).AppliedDPI",
  'ConvertTo-Json -Compress @{ width = $p.Bounds.Width; height = $p.Bounds.Height; availWidth = $p.WorkingArea.Width; availHeight = $p.WorkingArea.Height; dpi = $dpi }'
].join('; ')

export async function readMachine(): Promise<Machine> {
  const gib = totalmem() / 2 ** 30
  const machine: Machine = {
    cores: availableParallelism(),
    memory: Math.min(8, 2 ** Math.floor(Math.log2(Math.max(gib, 0.25)))),
    screen: null
  }
  if (process.platform !== 'win32') return machine
  const child = Bun.spawn(['powershell.exe', '-NoProfile', '-NonInteractive', '-Command', SCRIPT], {
    stdin: 'ignore',
    stderr: 'ignore'
  })
  const [output, code] = await Promise.all([new Response(child.stdout).text(), child.exited])
  if (code !== 0) return machine
  const info = JSON.parse(output) as {
    width: number
    height: number
    availWidth: number
    availHeight: number
    dpi: number | null
  }
  if (info.width > 0 && info.height > 0) {
    machine.screen = {
      width: info.width,
      height: info.height,
      availWidth: info.availWidth,
      availHeight: info.availHeight,
      pixelRatio: info.dpi ? info.dpi / 96 : 1
    }
  }
  return machine
}
