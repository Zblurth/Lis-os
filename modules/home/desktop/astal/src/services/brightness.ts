import GObject, { register, property } from "astal/gobject"
import { monitorFile, readFileAsync } from "astal/file"
import { exec, execAsync } from "astal/process"

@register({ GTypeName: "Brightness" })
export default class Brightness extends GObject.Object {
  static instance: Brightness
  static get_default() {
    if (!this.instance) this.instance = new Brightness()
    return this.instance
  }

  #screen = 0
  #max = 0
  #device = ""

  @property(Number)
  get screen() { return this.#screen }

  set screen(percent) {
    if (percent < 0) percent = 0
    if (percent > 1) percent = 1
    
    // Update local immediately for responsiveness
    this.#screen = percent
    this.notify("screen")

    if (this.#device) {
        execAsync(`brightnessctl -d ${this.#device} set ${Math.floor(percent * 100)}% -q`)
            .catch(print)
    }
  }

  constructor() {
    super()
    this.init()
  }

  async init() {
    try {
        // Find the first backlight device
        const devices = await execAsync("ls -1 /sys/class/backlight").catch(() => "")
        this.#device = devices.split("\n")[0]

        if (this.#device) {
            const maxStr = await execAsync(`brightnessctl -d ${this.#device} m`)
            this.#max = Number(maxStr)

            const path = `/sys/class/backlight/${this.#device}/brightness`
            
            // Initial Read
            const current = await readFileAsync(path)
            this.#screen = Number(current) / this.#max
            this.notify("screen")

            // Monitor changes
            monitorFile(path, async f => {
                const v = await readFileAsync(f)
                this.#screen = Number(v) / this.#max
                this.notify("screen")
            })
        } else {
            console.log("[Brightness] No backlight device found (Desktop mode?)")
        }
    } catch (e) {
        console.error("[Brightness] Error initializing:", e)
    }
  }
}
