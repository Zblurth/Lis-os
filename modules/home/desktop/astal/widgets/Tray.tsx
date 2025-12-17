import AstalTray from "gi://AstalTray?version=0.1";
import { bind, Variable, GLib } from "astal";
import LayoutService from "../src/LayoutService"
import { Gtk } from "astal/gtk3"
import ThemedIcon from "../src/components/ThemedIcon"

export default function Tray() {
    const tray = AstalTray.get_default()
    const layout = LayoutService.get_default()

    const revealed = Variable(false);
    let timeoutId: number | null = null;

    // Derive CSS from LayoutService
    const iconCss = layout.workspaceIconSize.as(size => `font-size: ${size}px;`);

    const cancelTimeout = () => {
        if (timeoutId) {
            GLib.source_remove(timeoutId);
            timeoutId = null;
        }
    };

    const startTimeout = () => {
        cancelTimeout();
        timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 3000, () => {
            revealed.set(false);
            timeoutId = null;
            return GLib.SOURCE_REMOVE;
        });
    };

    return (
        <eventbox onHoverLost={startTimeout} onHover={cancelTimeout}>
            <box className="WidgetPill" valign={Gtk.Align.FILL} css="padding: 0 8px;">
                <button
                    className="TrayToggle"
                    onClicked={() => revealed.set(!revealed.get())}
                    css="padding: 0px; border: none; background: transparent;"
                >
                    <icon icon={bind(revealed).as(r => r ? "pan-end-symbolic" : "pan-start-symbolic")} css={iconCss} />
                </button>

                <revealer
                    transitionType={Gtk.RevealerTransitionType.SLIDE_LEFT}
                    revealChild={bind(revealed)}
                >
                    <box className="TrayItems gap-1" css="padding-left: 4px;">
                        {bind(tray, "items").as(items => items.map(item => (
                            <menubutton
                                className="TrayIcon"
                                tooltipMarkup={bind(item, "tooltipMarkup")}
                                usePopover={false}
                                actionGroup={bind(item, "actionGroup").as(ag => ["dbusmenu", ag])}
                                menuModel={bind(item, "menuModel")}>
                                <icon
                                    gicon={bind(item, "gicon")}
                                    icon={bind(item, "iconName").as(name => name || "")}
                                    css={iconCss}
                                />
                            </menubutton>
                        )))}
                    </box>
                </revealer>
            </box>
        </eventbox>
    )
}
