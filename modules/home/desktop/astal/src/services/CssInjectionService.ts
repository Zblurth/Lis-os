import { App } from "astal/gtk3"
import ConfigAdapter, { Config } from "../ConfigAdapter"

class CssInjectionService {
    private static instance: CssInjectionService

    static get(): CssInjectionService {
        if (!this.instance) this.instance = new CssInjectionService()
        return this.instance
    }

    constructor() {
        this.init()
    }

    private init() {
        // Subscribe to config changes
        ConfigAdapter.get().adapter.subscribe((config) => {
            this.generateAndApply(config)
        })

        // Initial apply
        this.generateAndApply(ConfigAdapter.get().value)
    }

    private generateAndApply(config: Config) {
        try {
            const css = this.generateCss(config)
            App.apply_css(css)
            console.log("[CssInjectionService] CSS injected successfully.")
        } catch (e) {
            console.error(`[CssInjectionService] Failed to inject CSS: ${e}`)
        }
    }

    private generateCss(c: Config): string {
        const rawU = Math.floor(c.layout.barHeight * c.scaling.unitRatio)
        const U = isNaN(rawU) || rawU <= 0 ? 8 : rawU
        const R = c.scaling.radiusRatio

        const spacing1 = U * 1
        const spacing2 = U * 2
        const spacing3 = U * 3
        const marginV = Math.floor(U * (c.layout.padding?.vertical ?? 0))
        const marginH = Math.floor(U * (c.layout.padding?.horizontal ?? 3))
        // Inner padding is NOT scaled by U for finer control (pixels), or we can scale it.
        // User asked for "tight" control. Let's make it plain pixels or scalable?
        // Use U if it seems right, but usually padding involves smaller adjustments.
        // Reverting to plain pixels from config as 'spacing2' was U*2 which is huge (almost 40px at 1080p).
        // Let's stick to pixels for inner padding if raw value is provided. 
        // Actually, let's treat it as U-scaled for consistency if it's small, or pixels if large?
        // No, simplest is:
        const innerPadding = c.layout.padding?.inner ?? Math.floor(U * 2);

        const radius2 = Math.floor(U * R * 2)
        const fontSize = Math.max(Math.floor(c.layout.barHeight * c.scaling.fontRatio), c.scaling.minFontSize)
        const workspaceIconSize = Math.floor(c.layout.barHeight * (c.layout.bar.workspaceScale ?? 0.5))

        const artSize = Math.floor(c.layout.barHeight * 0.9); // Larger for premium feel
        const opacity = c.appearance.barOpacity ?? 0.85;

        return `
@define-color primary ${c.appearance.colors.primary};
@define-color surface ${c.appearance.colors.surface};
@define-color surfaceDarker ${c.appearance.colors.surfaceDarker};
@define-color text ${c.appearance.colors.text};
@define-color border ${c.appearance.colors.border};
@define-color accent ${c.appearance.colors.accent};
@define-color bar_bg_base ${c.appearance.colors.bar_bg};
@define-color bar_bg alpha(@bar_bg_base, ${opacity});

.WidgetPill {
    background-color: @surface;
    padding: 0px ${innerPadding}px;
    margin: ${marginV}px ${marginH}px;
    min-height: 0px;
    min-width: 0px;
    border-radius: ${radius2}px;
}

.MediaPill {
    background-color: @surface;
    padding: 0px ${innerPadding}px;
    margin: ${marginV}px ${marginH}px;
    min-height: 0px;
    min-width: 0px;
    border-radius: ${radius2}px;
}

.WidgetPill label, .MediaPill label {
    font-size: ${fontSize}px;
    color: @text;
}

.MediaProPill {
    background-color: @surface;
    padding: 0px;
    margin: ${marginV}px ${marginH}px;
    min-height: 0px;
    min-width: 0px;
    border-radius: ${radius2}px;
}

.MediaProContent {
    padding-right: ${innerPadding}px;
    padding-left: 2px;
}

.ArtCircle {
    min-width: ${artSize}px;
    min-height: ${artSize}px;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    background-color: @surfaceDarker;
}

.Workspaces {
    background-color: transparent;
    padding: 0px ${innerPadding}px;
    margin: ${marginV}px ${marginH}px;
}

.Workspaces .workspace {
    border-radius: ${radius2}px;
}

.WorkspaceIcon {
    /* Dynamic pixelSize via TS */
    text-shadow: none;
    -gtk-icon-shadow: none; 
}

.Workspaces > button {
    margin-right: ${Math.floor(innerPadding / 2)}px;
}
.Workspaces > button:last-child {
    margin-right: 0px;
}

.ArtCircle icon {
    color: @text;
}

.TrackInfo {
    margin: 0px ${spacing1}px;
}

.TrackTitle {
    font-size: ${fontSize}px;
    font-weight: 600;
    color: @text;
}

.TrackArtist {
    font-size: ${fontSize}px;
    font-weight: 500;
    color: @accent;
}

.gap-1 > * {
    margin-right: ${spacing1}px;
}
.gap-1 > *:last-child {
    margin-right: 0px;
}

.gap-2 > * {
    margin-right: ${spacing2}px;
}
.gap-2 > *:last-child {
    margin-right: 0px;
}

.gap-3 > * {
    margin-right: ${spacing3}px;
}
.gap-3 > *:last-child {
    margin-right: 0px;
}

.gap-half > * {
    margin-right: ${Math.floor(spacing1 / 2)}px;
}
.gap-half > *:last-child {
    margin-right: 0px;
}
`
    }
}

export default CssInjectionService
