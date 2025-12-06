import { App } from "astal/gtk3"
import style from "./style.css"
import Bar from "./widget/Bar"

App.start({
    css: style,
    main() {
        // App.get_monitors() depends on GDK.
        // For Niri, usually one bar per monitor.
        App.get_monitors().map(Bar)
    },
})
