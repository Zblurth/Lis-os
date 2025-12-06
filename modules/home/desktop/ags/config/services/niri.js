import Service from "resource:///com/github/Aylur/ags/service.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import Gio from "gi://Gio";
import GLib from "gi://GLib";

class NiriService extends Service {
  static {
    Service.register(this, {
      "workspaces-changed": [],
    });
  }

  _workspaces = [];

  get workspaces() {
    return this._workspaces;
  }

  constructor() {
    super();
    this._connect();
  }

  _connect() {
    try {
      const socketPath = GLib.getenv("NIRI_SOCKET");
      if (!socketPath) return console.error("NIRI_SOCKET not found");

      const client = new Gio.SocketClient();
      const address = new Gio.UnixSocketAddress({ path: socketPath });
      this._connection = client.connect(address, null);

      const output = this._connection.get_output_stream();
      const input = this._connection.get_input_stream();

      // Send Request for Event Stream
      // We use a raw write to the socket
      const request = JSON.stringify({ Request: { EventStream: {} } });
      output.write_all(request + "\n", null);

      // Read Loop
      const dataInput = new Gio.DataInputStream({ base_stream: input });
      this._readLoop(dataInput);

      // Initial fetch to populate state immediately
      Utils.execAsync(["niri", "msg", "-j", "workspaces"]).then((out) => {
        this._workspaces = JSON.parse(out).sort((a, b) => a.idx - b.idx);
        this.emit("changed");
      });
    } catch (e) {
      console.error("Niri Service Failed:", e);
    }
  }

  _readLoop(dataInput) {
    dataInput.read_line_async(0, null, (stream, res) => {
      try {
        const [line] = stream.read_line_finish(res);
        if (line) {
          const text = new TextDecoder().decode(line);
          this._handleEvent(JSON.parse(text));
          this._readLoop(dataInput); // Continue listening
        }
      } catch (e) {
        console.error("Niri Stream Error:", e);
      }
    });
  }

  _handleEvent(event) {
    // The event format usually wraps in { "Ok": { "Event": ... } } or just the Event depending on version
    // We look for specific keys
    let e = event;
    if (event.Ok?.Event) e = event.Ok.Event; // Handle nested format
    if (event.Event) e = event.Event;

    if (e.WorkspacesChanged) {
      this._workspaces = e.WorkspacesChanged.workspaces.sort(
        (a, b) => a.idx - b.idx,
      );
      this.emit("changed");
      this.emit("workspaces-changed");
    }

    // We can add WindowFocusChanged later
  }
}

// Export a singleton instance
export default new NiriService();
