import { Service, GObject, signal, property, register } from "astal/gobject"
import { GLib, Gio } from "astal"

// The Signal Types
@register({ GTypeName: "NiriService" })
export default class Niri extends Service {
    static instance: Niri
    static get default() {
        if (!this.instance) this.instance = new Niri()
        return this.instance
    }

    // Define properties we want to bind to
    @property(Object) workspaces: any[] = []
    @property(Number) focusedWorkspaceId: number | null = null

    private socketAddr: string | null = null

    constructor() {
        super()
        this.socketAddr = GLib.getenv("NIRI_SOCKET")
        if (this.socketAddr) {
            // Initial fetch
            this.syncWorkspaces()
            // We should ideally listen to the event stream here
            // For now, we sync on interval to ensure stability without complex socket parsing
            // But this is encapsulated in the service, so the Widget doesn't know.
            setInterval(() => this.syncWorkspaces(), 300)
        }
    }

    private syncWorkspaces() {
        try {
            const [_, out] = GLib.spawn_command_line_sync("niri msg -j workspaces")
            const dec = new TextDecoder("utf-8")
            const json = JSON.parse(dec.decode(out))

            this.workspaces = json

            // @ts-ignore
            const active = json.find(w => w.is_active)
            this.focusedWorkspaceId = active ? active.id : null

            this.notify("workspaces")
            this.notify("focused-workspace-id")
        } catch (e) {
            console.error(e)
        }
    }

    focusWorkspace(idOrName: string | number) {
        GLib.spawn_command_line_async(`niri msg action focus-workspace ${idOrName}`)
        // The poll will pick up the change, or we can Optimistically update
    }
}
