🏙️ Deep Research Agent Protocol: The "Generated Citadel" Dashboard
Target: Astal V5 Dashboard Design Architect: Aether-Prime (Lis-os System) Mission: Design a Dashboard architecture that strictly adheres to the "Generated Citadel" protocol (V5).

🛑 NON-NEGOTIABLE PROTOCOLS (THE BIBLE)
You must internalize every word of this document. It is the core law of this environment.

📄 ASTAL_V5_BIBLE.md
# The Astal v5 Design Protocol
## "The Generated Citadel"
**Version:** 5.0 (The "Ground Truth" Release)  
**Status:** AUTHORITATIVE SOURCE OF TRUTH  
**Architect:** Aether-Prime  
**System Target:** Lis-OS (NixOS / Niri / Astal)
---
## 1. Core Principles (The Constitution)
The architecture of a desktop environment is not merely a collection of scripts; it is a statement of intent. The V5 Protocol represents a fundamental **ontological shift** for Project Lis-OS.
> [!IMPORTANT]
> We are moving from the "Math-in-TS" era to the **"Generated Citadel."**  
> This is not a refactor. This is a **regime change.**
The V5 architecture is built upon **four non-negotiable pillars**:
---
### 1.1 The Doctrine of Ground Truth
> There exists only one source of reality: **`default.toml`**
**The Principle:** If a pixel appears on the screen—whether it is the border radius of a button, the padding of a workspace indicator, or the font size of a clock—its value must be traceable, via a direct deterministic chain, back to a definition in `default.toml`.
**The Constraint:** Hardcoded visual values in TypeScript are **strictly forbidden**. A developer who writes `spacing={12}` is introducing a hidden dependency that bypasses the theming engine.
**The Implementation:**
- `default.toml` = the **genotype** of the system
- Runtime environment (CSS Injection, Layout Service, Registry) = the **phenotype**
- Any visual property not in config is a **mutation** (a bug)
---
### 1.2 The Bundle Reality Principle
> The code must assume it is running in a hostile, sealed environment where the filesystem is irrelevant.
**The Flaw:** When Astal is built with `ags bundle`, the entire application is compiled into `bundle.js`. The concept of "sibling files" ceases to exist. A `readdir` call that works in dev will crash in prod.
**The V5 Resolution:**
| Phase | Responsibility |
|-------|---------------|
| **Build Time** | `scripts/gen-registry.ts` scans widgets, generates static `registry.ts` |
| **Run Time** | Application imports from generated registry. No dynamic `import()`. No directory scanning. |
**The Contract:** If a resource cannot be resolved at compile time, it does not exist.
---
### 1.3 Brutalist Efficiency (Performance & Memory)
> The User Interface is a tool for the mind, not a decoration for the screen.
**Frame Budget:**
- Floor: 60 FPS (16.6ms per frame)
- Target: <8ms for UI logic
**CSS vs LayoutService:**
| CSS (The Heavy Lifter) | LayoutService (The Scalpel) |
|------------------------|----------------------------|
| Colors, padding, margins, radii, fonts, shadows | Window dimensions, icon `pixel_size` |
| GTK engine handles at C speed | Only for integer GObject properties |
| Use `var(--spacing-2)` | Use `heightRequest={layout.barHeight}` |
**Memory Hygiene:**
> [!CAUTION]
> GJS operates at the intersection of Garbage Collection (SpiderMonkey) and Reference Counting (GObject). This intersection is a **minefield**.
**The Trap:** `widget.connect('signal', callback)` creates a reference cycle:
Widget → Signal → Closure → Widget

**The Fix:** 
- Use `bind()` (Astal handles lifecycle automatically)
- For manual connections, use `safeSignal()` with cleanup on destroy
---
### 1.4 Vibe Preservation (The Hot-Reload Contract)
> "Vibe Coding" is about flow. The feedback loop determines software quality.
**The Loop:** Edit `default.toml` → Save → Visual Update  
**Latency Target:** <500ms
**Mechanism:**
- **CSS Injection:** Visual tweaks trigger `GtkCssProvider.load_from_data()` instantly
- **State Preservation:** Structural changes trigger internal reload
**Rejection:** Any workflow requiring a full system rebuild for a UI tweak is **structurally rejected**.
---
## 2. System Architecture
The V5 architecture is a **layered citadel**. Data flows downwards from Ground Truth; events flow upwards from User.
```mermaid
graph TD
    subgraph "Layer 1: Ground Truth"
        A[default.toml]
    end
    subgraph "Layer 2: Translation"
        A -->|File Monitor| B(ConfigAdapter)
        B -->|Zod Validation| C{Valid?}
        C -->|No| D[Fallback + Alert]
        C -->|Yes| E[Config Object]
    end
    
    subgraph "Layer 3: Engine Room"
        E -->|Derives| F[CssInjectionService]
        E -->|Updates| G[LayoutService]
        H[gen-registry.ts] -->|Build Script| I[registry.ts]
    end
    
    subgraph "Layer 4: Presentation"
        F -->|:root vars| J[GtkCssProvider]
        G -->|Binds| K[Widgets]
        I -->|Static Imports| K
    end
    
    subgraph "Layer 5: Runtime"
        J --> K
        K -->|Render| L[GTK Window]
    end
3. Implementation Contracts
3.1 Ground Truth Propagation
Rule: No intermediate JSON files. No shell script theme generators. TOML → Runtime happens in memory.

// ConfigAdapter.ts
const ConfigSchema = z.object({
    layout: z.object({
        barHeight: z.number().min(20).max(100),
    }),
    appearance: z.object({
        colors: z.record(z.string().regex(/^#[0-9A-F]{6}$/i)),
    }),
});
Error Handling: If validation fails, fall back to SAFE_CONFIG and emit notification.

3.2 Registry Generation
Rule: No Gio.File.enumerate_children at runtime.

// package.json
{
  "build": "node scripts/gen-registry.js && ags bundle app.tsx bundle.js"
}
3.3 LayoutService Minimization
Forbidden (Math-in-TS Heresy):

// ❌ DO NOT
spacing={layout.P(1)}
borderRadius={layout.Radius(2)}
fontSize={layout.FontSize(h)}
Required (CSS-First):

// ✅ DO THIS
className="WidgetPill"
// In CSS: .WidgetPill { padding: var(--spacing-1); border-radius: var(--radius-2); }
Allowed in LayoutService:

barHeight (Window.heightRequest)
iconSize (Gtk.Image.pixel_size for crispness)
launcherGeometry (complex grid math)
3.4 Memory Hygiene (The Leak Proof)
Rule: Every signal connection must have a deterministic disconnection path.

---
## 🛠️ THE RUNTIME ENGINE (SOURCE CODE)
*How the system currently implements V5. Use this as your template.*
### 📄 src/ConfigAdapter.ts (The Data Core)
```typescript
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
📄 src/services/CssInjectionService.ts (The Styling Brain)
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
/* ... rest of CSS ... */
`
    }
}
export default CssInjectionService
📄 scripts/gen-registry.js (The Build Constraint)
const { readdirSync, writeFileSync } = require('fs');
const { join, basename } = require('path');
// CONFIGURE PATHS
const WIDGETS_DIR = './widgets';
const REGISTRY_FILE = './src/registry.ts';
console.log(`🔍 Scanning ${WIDGETS_DIR} for widgets...`);
try {
    // 1. Scan Directory
    const files = readdirSync(WIDGETS_DIR)
        .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
    if (files.length === 0) {
        console.warn("⚠️  No widgets found in " + WIDGETS_DIR);
    }
    // 2. Generate Imports & Map Entries
    const imports = [];
    const mapEntries = [];
    files.forEach(f => {
        const name = basename(f, '.tsx').replace('.ts', '');
        const importName = name;
        // Construct Import
        imports.push(`import ${importName} from '../widgets/${name}';`);
        // Construct Map Entry ("clock": Clock)
        // Normalize key: remove "Widget" suffix, lowercase
        const key = name.toLowerCase().replace(/widget$/, '');
        mapEntries.push(`    "${key}": ${importName},`);
    });
    // 3. Generate File Content
    const content = `// AUTO-GENERATED FILE - DO NOT EDIT
// Generated by scripts/gen-registry.js
// Definition of the "Bundle Reality" - All available widgets.
${imports.join('\n')}
export const WIDGET_MAP = {
${mapEntries.join('\n')}
} as const;
export type WidgetId = keyof typeof WIDGET_MAP;
export default WIDGET_MAP;
`;
    // 4. Write to Disk
    writeFileSync(REGISTRY_FILE, content);
    console.log(`✅ Generated registry.ts with ${files.length} widgets.`);
} catch (error) {
    console.error("❌ Failed to generate registry:", error);
    process.exit(1);
}
8. Theme Engine Context (The Palette)
How colors are generated. This is why we use variables like @primary and @bar_bg.

📄 THEME_ENGINE.md
# Lis-OS Theme Engine
**Architecture:** Python + Oklab Color Science  
**Dependencies:** ImageMagick, Pastel, SWWW, coloraide
## Moods (`config/moods.json`)
| Mood | Fallback | Description |
|------|----------|-------------|
| `adaptive` | `#7E9CD8` | Context-aware warmth, faithful hue |
| `atmospheric` | `#BD93F9` | High contrast, hue rotation, temp inversion |
| `pastel` | `#FFB8C6` | High lightness, soft colors |
| `deep` | `#BD93F9` | OLED-friendly, very dark backgrounds |
## Outputs
| Path | Content |
|------|---------|
| `~/.cache/theme-engine/palette.json` | Full palette JSON |
| `~/.cache/wal/ags-colors.css` | GTK/AGS CSS variables |
| `~/.config/astal/appearance.json` | Palette for Astal widgets |
| `~/.cache/lis-icons/` | Tinted application icons |
9. Noctalia Reference (Control Center)
The user wants this functionality, but V5-compliant.

Reference Architecture:

Panel Level: The top-level ColumnLayout container (like a Window).
Card Level: Grouped functionality (Profile, Shortcuts, Media).
Widget Level: Small interactive toggles (WiFi, Bluetooth).
Data-Driven Requirements: The user wants a configurable JSON structure like this to determine what shows up:

{
  "controlCenter": {
    "cards": [
      { "id": "profile-card", "enabled": true },
      { "id": "shortcuts-card", "enabled": true },
      { "id": "media-sysmon-card", "enabled": true }
    ],
    "shortcuts": {
      "left": [ { "id": "WiFi" }, { "id": "Bluetooth" } ],
      "right": [ { "id": "NightLight" }, { "id": "ScreenRecorder" } ]
    }
  }
}
10. Research Mission
Goal: Design the Lis-os Dashboard/Control Center.

Questions:

Registry Scaling: How do we adapt 
gen-registry.js
 to handle "Cards" and "Toggles" separately from "Bar Widgets"? Should we have multiple maps?
Styling Strategy: How do we expose Dashboard-specific layout variables (e.g., Grid Gap, Card Radius) in 
default.toml
 without polluting the global [layout] namespace?
Component Architecture: Provide a pseudo-code implementation for Dashboard.tsx that iterates over the config and renders cards dynamically, handling "safe rendering" (try-catch blocks per card).


Noctalia Dashboard (Control Center) Deep Dive
Source File: 
ControlCenterPanel.qml

This document analyzes the architecture of Noctalia's Dashboard ("Control Center") to assist in replicating it within an Astal/AGS environment.

I. Architectural Overview
The Dashboard is a composite hierarchical system with three distinct layers of abstraction:

Panel Level: The top-level window/container (ControlCenterPanel).
Card Level: High-level semantic blocks (e.g., Profile, Media, QuickSettings) stacked vertically.
Widget Level: Small, interactive toggles (e.g., WiFi, Bluetooth) housed within the QuickSettings card.
ControlCenterPanel(ColumnLayout)
ProfileCard
ShortcutsCard(Quick Settings)
AudioCard
WeatherCard
Media & SysMon Grid
Left RowLayout
Right RowLayout
WiFi Widget
Bluetooth Widget
NightLight Widget
II. Layer 1: The Panel (Container)
File: 
Modules/Panels/ControlCenter/ControlCenterPanel.qml

The panel acts as the data controller and layout engine.

Key Logic
Dynamic Rendering: It uses a Repeater bound to Settings.data.controlCenter.cards.
Layout: A simple ColumnLayout with consistent spacing (Style.marginL).
Component Mapping: It uses a hardcoded switch statement to map JSON IDs to local QML Components (e.g., "profile-card" -> ProfileCard {}).
ColumnLayout {
  Repeater {
    model: Settings.data.controlCenter.cards // [ {id: "profile-card", enabled: true}, ... ]
    Loader {
      active: modelData.enabled
      // Logic to choose component based on modelData.id
      sourceComponent: {
        switch (modelData.id) {
          case "profile-card": return profileCard;
          case "shortcuts-card": return shortcutsCard;
          // ...
        }
      }
    }
  }
}
Replication Note: In Astal (TSX), this maps directly to a .map() function in your JSX rendering:

<box vertical>
  {config.cards.map(card => {
     switch(card.id) { 
        case "profile": return <ProfileCard />;
        case "shortcuts": return <ShortcutsCard />;
     }
  })}
</box>
III. Layer 2: The Cards
Cards are the major building blocks. They are independent components located in Modules/Cards/.

1. ProfileCard
File: Modules/Cards/ProfileCard.qml

Layout: RowLayout.
Content:
Avatar: NImageRounded (circular).
Info: Hostname/User (from HostService), Uptime (from uptime command).
Actions: NIconButtons for Settings, Power, Close.
2. ShortcutsCard (The "Quick Settings")
File: Modules/Cards/ShortcutsCard.qml This is the most complex card as it introduces the Widget Layer.

Structure: It's a RowLayout containing two NBox containers (Left and Right groups).
Data Source: Settings.data.controlCenter.shortcuts.left and .right.
Dynamic Loading: Inside each box, it uses ControlCenterWidgetLoader to instantiate small widgets.
// ShortcutsCard.qml
RowLayout {
  // Left Group
  NBox {
    Repeater {
      model: Settings.data.controlCenter.shortcuts.left
      delegate: ControlCenterWidgetLoader { 
        widgetId: modelData.id 
      }
    }
  }
  // Right Group (Same logic)
}
3. Media & System Monitor
File: ControlCenterPanel.qml (Inline Component)

Layout: RowLayout combining MediaCard and SystemMonitorCard side-by-side.
IV. Layer 3: The Widgets (Toggle System)
Files:

Registry: Services/UI/ControlCenterWidgetRegistry.qml
Loader: Modules/Panels/ControlCenter/ControlCenterWidgetLoader.qml
Widgets: Modules/Panels/ControlCenter/Widgets/*.qml
This system allows the user to reorder toggles (WiFi, BT, etc.) via JSON without changing code.

The Registry
A Singleton that maps string IDs to Component objects.

// ControlCenterWidgetRegistry.qml
widgets: {
  "Bluetooth": bluetoothComponent,
  "WiFi": wiFiComponent,
  "NightLight": nightLightComponent,
  // ...
}
The Loader
Takes a widgetId, looks it up in the Registry, and instantiates it using a Loader.

// ControlCenterWidgetLoader.qml
Loader {
  sourceComponent: ControlCenterWidgetRegistry.getWidget(widgetId)
}
The Widget Example (Bluetooth.qml)
Simple, self-contained interactive buttons.

NIconButtonHot {
  icon: BluetoothService.enabled ? "bluetooth" : "bluetooth-off"
  onClicked: BluetoothService.toggle()
}
V. Data & Configuration
The entire structure is data-driven by settings.json (via Settings.qml).

Example implementation of settings.json structure:

{
  "controlCenter": {
    "cards": [
      { "id": "profile-card", "enabled": true },
      { "id": "shortcuts-card", "enabled": true },
      { "id": "media-sysmon-card", "enabled": true }
    ],
    "shortcuts": {
      "left": [ { "id": "WiFi" }, { "id": "Bluetooth" } ],
      "right": [ { "id": "NightLight" }, { "id": "ScreenRecorder" } ]
    }
  }
}
VI. Replicating in Astal
To build this in Astal:

State Management: Create a Variable or Service to hold your configuration (Cards order, Widgets list).
Top Level: A Window containing a Box (vertical).
Rendering:
Iterate your config array.
Return specific TSX components (<Profile />, <QuickSettings />).
QuickSettings:
Create a map of components: const widgets = { WiFi: <WifiToggle />, Bluetooth: <BluetoothToggle /> }.
Iterate your "left" and "right" config arrays.
Render widgets[id].
This strictly adheres to the "Data-Driven" architecture Noctalia uses, ensuring runtime configurability.