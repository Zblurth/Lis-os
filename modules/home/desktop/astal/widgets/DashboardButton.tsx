import { App, Gtk } from "astal/gtk3";
import LayoutService from "../src/LayoutService";

export default function DashboardButton() {
    const layout = LayoutService.get_default();
    // GTK3 can't use var() in inline css - use LayoutService binding
    const iconCss = layout.barHeight.as(h => `font-size: ${Math.floor(h * 0.7)}px;`);

    return <button
        className="DashboardIcon"
        onClicked={() => App.toggle_window("dashboard")}
        valign={Gtk.Align.CENTER}
    >
        <icon icon="view-app-grid-symbolic" css={iconCss} />
    </button>
}
