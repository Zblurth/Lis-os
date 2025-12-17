import { Variable, bind, Binding } from "astal";
import { Gdk } from "astal/gtk3";
import ConfigAdapter, { Config } from "./ConfigAdapter";

interface ColorsConfig {
    primary: string;
    surface: string;
    surfaceDarker: string;
    text: string;
    border: string;
    accent: string;
}

class LayoutService {
    static instance: LayoutService;

    static get_default() {
        if (!this.instance) this.instance = new LayoutService();
        return this.instance;
    }

    private config: Binding<Config>;

    // --- Reactive Primitives ---
    readonly barHeight: Binding<number>;
    readonly unitRatio: Binding<number>;
    readonly radiusRatio: Binding<number>;
    readonly fontRatio: Binding<number>;
    readonly minFontSize: Binding<number>;

    // The Base Unit U
    readonly U: Binding<number>;

    // --- Component-Specific Configs ---
    readonly colors: Binding<ColorsConfig>;

    // --- Widget Bindings (Pre-calculated types) ---
    readonly workspaceIconSize: Binding<number>;
    readonly workspacePadding: Binding<number>;
    readonly workspaceFontSize: Binding<number>;


    // --- Dynamic Environmental Bindings ---
    readonly screenWidth: Binding<number>;

    // --- Rule Set Gamma & Delta (Computed Layouts) ---


    constructor() {
        this.config = bind(ConfigAdapter.get().adapter);
        const config = this.config;

        // 1. Master Scaling Source: Bar Height
        this.barHeight = config.as(c => c.layout.barHeight);

        // 2. Unit Ratio
        this.unitRatio = config.as(c => c.scaling.unitRatio);

        // 3. The Base Unit U (Computed Priority)
        // U = floor(barHeight * ratio)
        this.U = bind(Variable.derive([this.barHeight, this.unitRatio], (bar: number, ratio: number) =>
            Math.floor(bar * ratio)
        ));

        // Dynamic Screen Width
        this.screenWidth = config.as(c => {
            const override = c.layout.screenWidth;
            if (override > 0) return override;
            const screen = Gdk.Screen.get_default();
            return screen ? screen.get_width() : 1920;
        });

        // 4. Radius & Font Ratios
        this.radiusRatio = config.as(c => c.scaling.radiusRatio);
        this.fontRatio = config.as(c => c.scaling.fontRatio);
        this.minFontSize = config.as(c => c.scaling.minFontSize);

        // --- Component-Specific Configs ---
        // Constructing "View Models" from the raw config
        this.colors = config.as(c => ({
            primary: c.appearance.colors.primary,
            surface: c.appearance.colors.surface,
            surfaceDarker: c.appearance.colors.surfaceDarker,
            text: c.appearance.colors.text,
            border: c.appearance.colors.border,
            accent: c.appearance.colors.accent,
        }));

        // --- Widget Bindings (Implementation) ---
        // Workspace Scale strictly from config
        const workspaceScale = config.as(c => c.layout.bar.workspaceScale);

        // Bar-Relative Unit (BU) strictly for Bar contents
        const BU = bind(Variable.derive([this.barHeight, workspaceScale], (h: number, s: number) => Math.floor(h * s)));
        this.workspaceIconSize = BU;
        this.workspacePadding = BU;

        this.workspaceFontSize = bind(Variable.derive([BU, this.fontRatio, this.minFontSize], (bu: number, fr: number, min: number) =>
            Math.max(Math.floor(bu * fr), min)
        ));

        /**
         * P(x), Radius(x), FontSize(x) are BANNED.
         * Use CSS Variables injected by CssInjectionService.
         */
    }
}

export default LayoutService;
