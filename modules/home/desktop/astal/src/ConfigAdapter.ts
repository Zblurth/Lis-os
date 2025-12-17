import { Variable, GLib } from "astal"
import { monitorFile, readFileAsync, writeFileAsync } from "astal/file"
import { z } from "zod"
import { parse } from "smol-toml"

// --- ZOD SCHEMAS ---

const ScalingSchema = z.object({
    unitRatio: z.number().default(0.05),
    radiusRatio: z.number().default(2.0),
    fontRatio: z.number().default(0.45),
    minFontSize: z.number().default(11),
})

const LayoutConfigSchema = z.object({
    barHeight: z.number().default(38),
    screenWidth: z.number().default(0), // 0 = Auto
    launcherWidth: z.number().default(0.2), // Ratio of screen width
    launcherHeight: z.number().default(0.7), // Ratio of screen height
    clipboardWidth: z.number().default(0.2), // Ratio of screen width
    clipboardHeight: z.number().default(0.7), // Ratio of screen height
    padding: z.object({
        vertical: z.number().default(0),
        horizontal: z.number().default(3),
        inner: z.number().default(4),
    }).default({}),
    bar: z.object({
        workspaceScale: z.number().default(0.5),
        marginTop: z.number().default(0),
        marginBottom: z.number().default(0),
        left: z.array(z.string()).default([]),
        center: z.array(z.string()).default([]),
        right: z.array(z.string()).default([]),
    }).default({}),
    // Deprecated / Legacy sections removed to reduce zombie config
    launcher: z.any().optional(),
    clipboard: z.any().optional(),
})

const AppearanceConfigSchema = z.object({
    barOpacity: z.number().default(0.85),
    colors: z.object({
        primary: z.string().default("#a6da95"),
        surface: z.string().default("#1e1e2e"),
        surfaceDarker: z.string().default("#181825"),
        text: z.string().default("#cad3f5"),
        border: z.string().default("rgba(255, 255, 255, 0.1)"),
        accent: z.string().default("#8aadf4"),
        bar_bg: z.string().default("#000000"), // Now decoupled from opacity
    }).default({}),
    // Deprecated / Legacy
    glass: z.any().optional(),
    launcher: z.any().optional(),
    elevation: z.any().optional(),
}).default({})

const LimitsSchema = z.object({
    mediaTitle: z.number().default(25),
    mediaArtist: z.number().default(15),
    windowTitle: z.number().default(40),
})

const WidgetsSchema = z.object({
    clock: z.object({
        format: z.string().default("%H:%M"),
    }).default({}),
})

// Main Config Schema
const ConfigSchema = z.object({
    scaling: ScalingSchema.default({}),
    layout: LayoutConfigSchema.default({}),
    appearance: AppearanceConfigSchema.default({}),
    limits: LimitsSchema.default({}),
    widgets: WidgetsSchema.default({}),
})

export type Config = z.infer<typeof ConfigSchema>
export type ScalingConfig = z.infer<typeof ScalingSchema>
export type LayoutConfig = z.infer<typeof LayoutConfigSchema>
export type AppearanceConfig = z.infer<typeof AppearanceConfigSchema>

// --- ADAPTER ---

const SCRIPT_DIR = GLib.path_get_dirname(import.meta.url.replace("file://", ""))
const APP_NAME = "lis-bar"
const CONFIG_DIR = `${GLib.get_home_dir()}/.config/${APP_NAME}`
// Dev Mode Override
const DEV_TOML_PATH = `${GLib.get_home_dir()}/Lis-os/modules/home/desktop/astal/default.toml`
const APPEARANCE_JSON_PATH = `${GLib.get_home_dir()}/.config/astal/appearance.json`

export class ConfigAdapter {
    private static instance: ConfigAdapter
    private _state = new Variable<Config>(ConfigSchema.parse({}))
    private _tomlMonitor: any = null
    private _themeMonitor: any = null

    private constructor() {
        this.init()
    }

    static get(): ConfigAdapter {
        if (!ConfigAdapter.instance) {
            ConfigAdapter.instance = new ConfigAdapter()
        }
        return ConfigAdapter.instance
    }

    get adapter(): Variable<Config> {
        return this._state
    }

    get value(): Config {
        return this._state.get()
    }

    private async init() {
        console.log(`[ConfigAdapter] Initializing...`)

        // Priority: Dev Path > Script Dir Path
        let tomlPath = DEV_TOML_PATH
        if (GLib.file_test(tomlPath, GLib.FileTest.EXISTS)) {
            console.log(`[ConfigAdapter] Dev Mode Active: using local source config at ${tomlPath}`)
        } else {
            tomlPath = `${SCRIPT_DIR}/default.toml`
            if (!GLib.file_test(tomlPath, GLib.FileTest.EXISTS)) {
                tomlPath = `${GLib.path_get_dirname(SCRIPT_DIR)}/default.toml`
            }
        }

        if (GLib.file_test(tomlPath, GLib.FileTest.EXISTS)) {
            console.log(`[ConfigAdapter] Monitoring TOML at: ${tomlPath}`)
            await this.load(tomlPath)

            this._tomlMonitor = monitorFile(tomlPath, async () => {
                console.log("[ConfigAdapter] default.toml changed. Reloading...")
                await this.load(tomlPath)
            })
        } else {
            console.error(`[ConfigAdapter] FATAL: default.toml not found at ${tomlPath}`)
        }

        // Monitor Theme Engine Output
        if (GLib.file_test(APPEARANCE_JSON_PATH, GLib.FileTest.EXISTS)) {
            console.log(`[ConfigAdapter] Monitoring Theme at: ${APPEARANCE_JSON_PATH}`)
            this._themeMonitor = monitorFile(APPEARANCE_JSON_PATH, async () => {
                console.log("[ConfigAdapter] appearance.json changed. Reloading...")
                await this.load(tomlPath)
            })
        }
    }

    private async load(tomlPath: string) {
        try {
            // 1. Load TOML
            console.log(`[ConfigAdapter] Parsing TOML...`)
            const content = await readFileAsync(tomlPath)
            const parsedToml = parse(content)
            console.log(`[ConfigAdapter] TOML Parsed. keys: ${Object.keys(parsedToml)}`)

            // 2. Load Theme (appearance.json)
            let themeColors: any = {}
            if (GLib.file_test(APPEARANCE_JSON_PATH, GLib.FileTest.EXISTS)) {
                try {
                    const jsonContent = await readFileAsync(APPEARANCE_JSON_PATH)
                    const themeData = JSON.parse(jsonContent)
                    if (themeData.colors) {
                        themeColors = {
                            primary: themeData.colors.ui_prim,
                            surface: themeData.colors.surface,
                            surfaceDarker: themeData.colors.surfaceDarker,
                            text: themeData.colors.text,
                            // border: themeData.colors.surfaceLighter, // Optional mapping
                            accent: themeData.colors.syn_acc,
                            bar_bg: themeData.colors.bar_bg,
                        }
                        console.log("[ConfigAdapter] Merged theme engine colors.")
                    }
                } catch (e) {
                    console.error(`[ConfigAdapter] Failed to parse appearance.json: ${e}`)
                }
            } else {
                console.log("[ConfigAdapter] No appearance.json found. Using default.toml colors.")
            }

            // 3. Merge
            const mergedConfig = {
                ...parsedToml,
            }
            if (Object.keys(themeColors).length > 0) {
                // Ensure appearance object exists
                if (!mergedConfig.appearance) mergedConfig.appearance = {}
                // Ensure colors object exists
                if (!mergedConfig.appearance.colors) mergedConfig.appearance.colors = {}

                // Override colors
                Object.assign(mergedConfig.appearance.colors, themeColors)
                console.log("[ConfigAdapter] Colors overridden by Theme Engine.")
            }

            // 4. Validate with Zod
            const result = ConfigSchema.safeParse(mergedConfig)

            if (result.success) {
                this._state.set(result.data)
                console.log("[ConfigAdapter] Config loaded and validated successfully.")
            } else {
                console.error("[ConfigAdapter] Config Validation Failed:", result.error)
            }
        } catch (e) {
            console.error(`[ConfigAdapter] Failed to parse default.toml: ${e}`)
        }
    }
}

export default ConfigAdapter
