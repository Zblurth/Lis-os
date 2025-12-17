import { Gtk } from "astal/gtk3";

type SafeWidgetProps = {
    children?: any | (() => any);
};

export default function SafeWidget({ children }: SafeWidgetProps) {
    try {
        if (typeof children === "function") {
            return children();
        }
        return children;
    } catch (error) {
        print(`[SafeWidget] Error: ${error}`);
        return (
            <box css="background-color: #ff0000; padding: 2px;">
                <label label="ERR" css="color: white; font-weight: bold;" />
            </box>
        );
    }
}
