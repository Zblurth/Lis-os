import GObject, { property, register } from "astal/gobject";
import GLib from "gi://GLib?version=2.0";
import Gio from "gi://Gio?version=2.0";

export type Workspace = {
  id: number,
  idx: number,
  name: string | null,
  output: string,
  is_active: boolean,
  is_focused: boolean,
  active_window_id: number | null
}

export type Window = {
  id: number,
  title: string | null,
  app_id: string,
  workspace_id: number | null,
  is_focused: boolean
}

export type Monitor = {
  name: string
  make: string
  model: string
  serial: string
}

export type State = {
  workspaces: Map<number, Workspace>,
  windows: Map<number, Window>,
  monitors: Map<string, Monitor>
}

export type OutputsWithWorkspacesWithWindows = Record<string, OutputWithWorkspacesWithWindows>
export type OutputWithWorkspacesWithWindows = {
  output: string,
  monitor: Monitor | null,
  workspaces: Record<number, WorkspaceWithWindows>
}
export type WorkspaceWithWindows = Workspace & {
  windows: Window[]
}

type ResponseOutputs = {
  Ok: {
    Outputs: Record<string, Monitor>
  }
}

@register({ GTypeName: 'Niri' })
export default class Niri extends GObject.Object {
  static instance: Niri
  static get_default() {
    if (!this.instance) {
      this.instance = new Niri()
    }
    return this.instance
  }

  #state: State

  @property(Object)
  get outputs(): OutputsWithWorkspacesWithWindows {
    const wsmap: OutputsWithWorkspacesWithWindows = {}
    
    // Initialize outputs from monitors
    for (const [name, monitor] of this.#state.monitors) {
        wsmap[name] = { output: name, monitor, workspaces: {} }
    }

    // Populate workspaces
    for (const ws of this.#state.workspaces.values()) {
        const output = ws.output;
        if (!wsmap[output]) {
             const monitor = this.#state.monitors.get(output) ?? null;
             wsmap[output] = { output, monitor, workspaces: {} }
        }
        
        // Add windows to workspace
        const windows = Array.from(this.#state.windows.values())
            .filter(w => w.workspace_id === ws.id);

        wsmap[output].workspaces[ws.id] = { ...ws, windows }
    }

    return wsmap
  }

  @property(Object)
  get windows(): Window[] {
      return Array.from(this.#state.windows.values());
  }

  // GObject property names are canonically kebab-case. 
  // Astal maps 'focusedWindow' getter to 'focused-window' property.
  @property(Object)
  get focusedWindow(): Window | null {
    for (const w of this.#state.windows.values()) {
        if (w.is_focused) return w;
    }
    return null;
  }

  @property(Object)
  get workspaces(): Workspace[] {
      return Array.from(this.#state.workspaces.values());
  }

  constructor() {
    super()
    this.#state = {
      workspaces: new Map(),
      windows: new Map(),
      monitors: new Map(),
    }
    this.reloadMonitors()
    this.listenEventStream()
  }

  public focusWorkspaceId(id: number) {
    const msg = { Action: { FocusWorkspace: { reference: { Id: id } } } }
    this.oneOffCommand(JSON.stringify(msg))
  }

  public reloadMonitors() {
    this.#state.monitors = this.getMonitors()
    this.notify('outputs')
  }

  private newConnection(): Gio.SocketConnection {
    const path = GLib.getenv('NIRI_SOCKET')!
    const client = new Gio.SocketClient().connect(new Gio.UnixSocketAddress({ path }), null)
    return client
  }

  private oneOffCommand(jsonEncodedCommand: string): string {
    try {
        const client = this.newConnection()
        client.get_output_stream().write(jsonEncodedCommand + "\n", null)
        const inputstream = new Gio.DataInputStream({
        closeBaseStream: true,
        baseStream: client.get_input_stream()
        })
        const [response, _count] = inputstream.read_line_utf8(null)
        inputstream.close(null)
        if (!response) return ""
        return response
    } catch(e) {
        console.error(e)
        return ""
    }
  }

  private getMonitors(): Map<string, Monitor> {
    try {
        const resp = this.oneOffCommand(JSON.stringify("Outputs"))
        if (resp === "") return new Map()
        const parsed = JSON.parse(resp) as ResponseOutputs
        const outputs = parsed.Ok.Outputs
        return new Map(Object.values(outputs).map(({ name, make, model, serial }) => [name, { name, make, model, serial }]))
    } catch (e) {
        return new Map()
    }
  }

  private listenEventStream() {
    try {
        const client = this.newConnection()
        client.get_output_stream().write(JSON.stringify("EventStream") + "\n", null)
        const inputstream = new Gio.DataInputStream({
        closeBaseStream: true,
        baseStream: client.get_input_stream()
        })
        this.readLineSocket(inputstream, (stream, result) => {
        if (!stream) return
        const line = stream.read_line_finish(result)[0] ?? new Uint8Array([])
        const text = new TextDecoder().decode(line)
        if (text) {
            try {
                const message = JSON.parse(text)
                this.reconcileState(message)
            } catch (e) { console.error("Niri Parse Error", e) }
        }
        })
    } catch (e) { console.error("Niri Socket Error", e) }
  }

  private readLineSocket(inputstream: Gio.DataInputStream, callback: (stream: Gio.DataInputStream | null, result: Gio.AsyncResult) => void) {
    inputstream.read_line_async(0, null, (stream: Gio.DataInputStream | null, result: Gio.AsyncResult) => {
      callback(stream, result)
      if (!stream) return
      this.readLineSocket(stream, callback)
    })
  }

  private reconcileState(message: any) {
    let changed = false;
    
    if ('WorkspacesChanged' in message) {
      this.reconcileWorkspacesChanged(message.WorkspacesChanged.workspaces)
      changed = true;
    }
    if ('WorkspaceActivated' in message) {
      this.reconcileWorkspaceActivated(message.WorkspaceActivated)
      changed = true;
    }
    if ('WindowsChanged' in message) {
      this.reconcileWindowsChanged(message.WindowsChanged.windows)
      changed = true;
    }
    if ('WindowOpenedOrChanged' in message) {
      this.reconcileWindowOpenedOrChanged(message.WindowOpenedOrChanged.window)
      changed = true;
    }
    if ('WindowClosed' in message) {
      this.reconcileWindowClosed(message.WindowClosed)
      changed = true;
    }
    if ('WindowFocusChanged' in message) {
      this.reconcileWindowFocusChanged(message.WindowFocusChanged)
      changed = true;
    }

    if (changed) {
        this.notify('outputs')
        // Use kebab-case for GObject property notification
        this.notify('focused-window')
        this.notify('workspaces')
    }
  }

  private reconcileWorkspacesChanged(workspaces: Workspace[]) {
    this.#state.workspaces = new Map(workspaces.map(ws => ([ws.id, {
      id: ws.id,
      idx: ws.idx,
      name: ws.name,
      output: ws.output,
      active_window_id: ws.active_window_id,
      is_focused: ws.is_focused,
      is_active: ws.is_active
    }])))
  }

  private reconcileWorkspaceActivated(workspaceActivated: any) {
    const id: number = workspaceActivated.id
    const focused: boolean = workspaceActivated.focused
    const workspace = this.#state.workspaces.get(id)
    if (!workspace) return
    const output = workspace.output
    this.#state.workspaces = new Map(Array.from(this.#state.workspaces, ([key, ws]) => {
      if (ws.output == output) {
        return [key, { ...ws, is_active: focused && id === ws.id }]
      }
      return [key, ws]
    }))
  }

  private reconcileWindowsChanged(windows: Window[]) {
    this.#state.windows = new Map(windows.map(w => [w.id, w]))
  }

  private reconcileWindowOpenedOrChanged(window: Window) {
    this.#state.windows.set(window.id, window)
    if (window.is_focused) {
        // Unfocus others
        for (const [id, w] of this.#state.windows) {
            if (id !== window.id) w.is_focused = false
        }
    }
  }

  private reconcileWindowClosed(windowClosed: { id: number }) {
    this.#state.windows.delete(windowClosed.id)
  }

  private reconcileWindowFocusChanged(windowFocusChanged: { id: number }) {
    for (const [id, w] of this.#state.windows) {
        w.is_focused = (id === windowFocusChanged.id);
    }
  }
}
