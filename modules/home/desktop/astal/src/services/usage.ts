import { register, property } from "astal/gobject"
import { GLib, GObject } from "astal"
import { readFile } from "astal/file"
import { interval } from "astal"

type MemoryUsage = { percentage: number, total: number, used: number, free: number, available: number }
type CpuTime = { total: number, idle: number }

@register({ GTypeName: "Usage" })
export default class Usage extends GObject.Object {
  static instance: Usage
  static get_default() {
    if (!this.instance) this.instance = new Usage()
    return this.instance
  }

  @property(Number) get cpuUsage() { return this.#cpuUsage }
  @property(Object) get memory() { return this.#memory }
  @property(Number) get temperature() { return this.#temperature }

  #cpuUsage = 0
  #memory: MemoryUsage = { percentage: 0, total: 0, used: 0, free: 0, available: 0 }
  #temperature = 0
  #cpuStats = { total: 0, idle: 0 }

  constructor() {
    super()
    this.#cpuStats = this.getCPUUsage()
    this.#memory = this.getMemoryUsage()

    interval(2000, () => {
      const usage = this.getCPUUsage()
      const dtotal = usage.total - this.#cpuStats.total
      const didle = usage.idle - this.#cpuStats.idle
      this.#cpuUsage = dtotal === 0 ? 0 : (dtotal - didle) / dtotal
      this.#cpuStats = usage
      this.notify('cpu-usage')

      this.#temperature = this.getTemp();
      this.notify('temperature');
    })

    interval(5000, () => {
      this.#memory = this.getMemoryUsage()
      this.notify('memory')
    })
  }

  private getCPUUsage(): CpuTime {
    try {
        const stat = readFile('/proc/stat')
        const line = stat.split('\n')[0]
        const times = line.replace(/cpu\s+/, '').split(' ').map(Number)
        const idle = times[3] + times[4]
        const total = times.reduce((a, b) => a + b, 0)
        return { total, idle }
    } catch (e) { return { total: 0, idle: 0 } }
  }

  private getMemoryUsage(): MemoryUsage {
    try {
        const meminfo = readFile('/proc/meminfo')
        const lines = meminfo.split("\n")
        const getVal = (key: string) => {
            const line = lines.find(l => l.startsWith(key))
            if (!line) return 0
            return parseInt(line.split(/\s+/)[1]) * 1024
        }
        const total = getVal("MemTotal:")
        const available = getVal("MemAvailable:")
        const used = total - available
        return { percentage: total ? (used / total) : 0, total, used, free: 0, available: 0 }
    } catch (e) { return { percentage: 0, total: 0, used: 0, free: 0, available: 0 } }
  }

  // HOTSPOT HUNTER: Finds the max CPU temp
  private getTemp(): number {
      const basePaths = ['/sys/class/hwmon', '/sys/class/thermal'];
      let maxTemp = 0;
      let foundHighPriority = false;

      // Helper to read a number from a file
      const readNum = (path: string) => {
          try {
              const [ok, data] = GLib.file_get_contents(path);
              if (ok) return parseInt(new TextDecoder().decode(data).trim()) / 1000;
          } catch(e) {}
          return -1;
      }

      // 1. Scan HWMON (Best for CPU Packages)
      const hwmonDir = GLib.Dir.open('/sys/class/hwmon', 0);
      if (hwmonDir) {
          let name: string | null;
          while ((name = hwmonDir.read_name()) !== null) {
              const path = `/sys/class/hwmon/${name}`;
              
              // Iterate possible inputs (temp1 to temp10)
              for (let i = 1; i <= 10; i++) {
                  const labelPath = `${path}/temp${i}_label`;
                  const inputPath = `${path}/temp${i}_input`;
                  
                  if (!GLib.file_test(inputPath, GLib.FileTest.EXISTS)) continue;

                  // Check for High Priority Labels (AMD Tctl/Tdie, Intel Package)
                  if (GLib.file_test(labelPath, GLib.FileTest.EXISTS)) {
                      const [ok, labelData] = GLib.file_get_contents(labelPath);
                      if (ok) {
                          const label = new TextDecoder().decode(labelData).toLowerCase();
                          if (label.includes('tctl') || label.includes('tdie') || label.includes('package')) {
                              const t = readNum(inputPath);
                              if (t > 0) return t; // Return immediately if we found the exact package sensor
                          }
                      }
                  }
                  
                  // Keep track of the highest temp found as a fallback
                  const t = readNum(inputPath);
                  if (t > maxTemp) maxTemp = t;
              }
          }
          hwmonDir.close();
      }

      // 2. Scan Thermal Zones (Fallback)
      if (maxTemp === 0) {
          const thermalDir = GLib.Dir.open('/sys/class/thermal', 0);
          if (thermalDir) {
              let name: string | null;
              while ((name = thermalDir.read_name()) !== null) {
                  if (name.startsWith('thermal_zone')) {
                      const t = readNum(`/sys/class/thermal/${name}/temp`);
                      if (t > maxTemp) maxTemp = t;
                  }
              }
              thermalDir.close();
          }
      }

      return maxTemp;
  }
}
