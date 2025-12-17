import { GObject, register, property } from "astal/gobject";
import { Gio, GLib } from "astal";

// Nix will replace this with the real path during build
const CAVA_BINARY = "@CAVA_PATH@";

@register({ GTypeName: "Cava" })
export default class Cava extends GObject.Object {
    static instance: Cava;
    static get_default() {
        if (!this.instance) this.instance = new Cava();
        return this.instance;
    }

    @property(Object)
    get values() { return this.#values; }

    #values: number[] = [];
    #proc: Gio.Subprocess | null = null;
    #cancel: Gio.Cancellable | null = null;
    #bars = 20;

    constructor() {
        super();
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
            this.start();
            return false;
        });
    }

    private start() {
        if (this.#proc) return;

        try {
            // 1. Config
            const config = `
[general]
bars = ${this.#bars}
framerate = 60
[input]
method = pulse
source = auto
[output]
method = raw
raw_target = /dev/stdout
data_format = ascii
ascii_max_range = 100
`;
            const configPath = GLib.build_filenamev([GLib.get_tmp_dir(), "astal-cava.conf"]);
            GLib.file_set_contents(configPath, new TextEncoder().encode(config));

            print(`[Cava] Spawning binary: ${CAVA_BINARY}`);
            
            // 2. Spawn Directly (No Bash, Absolute Path)
            this.#proc = new Gio.Subprocess({
                argv: [CAVA_BINARY, "-p", configPath],
                flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            });

            this.#cancel = new Gio.Cancellable();
            const stdout = new Gio.DataInputStream({ base_stream: this.#proc.get_stdout_pipe()!, close_base_stream: true });
            this.readLoop(stdout);
            
            const stderr = new Gio.DataInputStream({ base_stream: this.#proc.get_stderr_pipe()!, close_base_stream: true });
            this.readErrorLoop(stderr);

        } catch (e) {
            console.error("[Cava] Startup Error: " + e);
        }
    }

    private readLoop(stream: Gio.DataInputStream) {
        stream.read_line_async(0, this.#cancel, (obj, res) => {
            try {
                const [lineBytes] = stream.read_line_finish(res);
                if (lineBytes) {
                    const line = new TextDecoder().decode(lineBytes);
                    // DEBUG: Uncomment if still having issues
                    // print(line);
                    this.#values = line.split(";")
                        .map(v => parseInt(v, 10))
                        .filter(v => !isNaN(v))
                        .slice(0, this.#bars);
                    this.notify("values");
                    this.readLoop(stream);
                }
            } catch (e) { }
        });
    }

    private readErrorLoop(stream: Gio.DataInputStream) {
        stream.read_line_async(0, this.#cancel, (obj, res) => {
            try {
                const [line] = stream.read_line_finish(res);
                if (line) {
                    print("[Cava LOG]: " + new TextDecoder().decode(line));
                    this.readErrorLoop(stream);
                }
            } catch (e) {}
        });
    }
}
