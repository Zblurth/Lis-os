import { Gdk, Gtk } from "astal/gtk3"
import { bind, Binding } from "astal"
import Niri, { WorkspaceWithWindows } from "../src/services/niri"
import LayoutService from "../src/LayoutService"
import ThemedIcon from "../src/components/ThemedIcon"

const niri = Niri.get_default()

function Workspace(workspace: WorkspaceWithWindows, showInactiveIcons: boolean, iconSize: Binding<number>) {
  const traits = ['workspace']
  if (workspace.is_active) traits.push('active')
  if (workspace.windows.length > 0) traits.push('populated')

  const showIcons = (workspace.is_active || showInactiveIcons) && workspace.windows.length > 0

  return (
    <button
      onClick={() => niri.focusWorkspaceId(workspace.id)}
      className={traits.join(' ')}
      valign={Gtk.Align.FILL}
      halign={Gtk.Align.CENTER}
    >
      <box
        className="WorkspaceContent"
        valign={Gtk.Align.CENTER}
        halign={Gtk.Align.CENTER}
      >
        <label
          className="ws-idx"
          label={workspace.idx.toString()}
        />
        {showIcons && workspace.windows.map(win => (
          <ThemedIcon
            appId={win.app_id}
            className="WorkspaceIcon"
            palette={workspace.is_active ? "accent" : "primary"}
            size={iconSize}
          />
        ))}
      </box>
    </button>
  )
}

function getMonitorName(gdkmonitor: Gdk.Monitor) {
  const display = Gdk.Display.get_default()!;
  const screen = display.get_default_screen();
  for (let i = 0; i < display.get_n_monitors(); ++i) {
    if (gdkmonitor === display.get_monitor(i)) return screen.get_monitor_plug_name(i);
  }
  return null;
}

export default function Workspaces({ monitor, showInactiveIcons = true }: { monitor: Gdk.Monitor, showInactiveIcons?: boolean }) {
  const monitorName = getMonitorName(monitor);
  if (!monitorName) return <box />;

  // Get dynamic icon size from LayoutService
  const layout = LayoutService.get_default()

  const workspacesForMe = bind(niri, 'outputs').as(outputs =>
    Object.values(outputs)
      .filter(o => o.monitor?.name === monitorName)
      .flatMap(o => Object.values(o.workspaces))
      .sort((a, b) => a.idx - b.idx)
      .filter(w => w.windows.length > 0 || w.is_active) // Hide empty inactive workspaces
  );

  return (
    <box className="Workspaces" valign={Gtk.Align.FILL}>
      {workspacesForMe.as(ws => ws.map(w => Workspace(w, showInactiveIcons, layout.workspaceIconSize)))}
    </box>
  )
}
