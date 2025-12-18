ASTAL_BIBLE_V6.md
Status: AUTHORITATIVE SOURCE OF TRUTH
Version: 6.0 (The "Cassowary Citadel")
Target: Lis-OS (NixOS / Niri / Astal GTK4)
Philosophy: Brutalist Efficiency (Zero-Cost, Deterministic, Event-Driven, Type-Safe)
Effective: 2025-12-18
Table of Contents
Architecture & Substrate
GTK4 Migration: Paradigm Shifts
Mathematical Layout: ConstraintShell
Niri IPC Bridge: Native Socket Client
Memory Safety: GObject/JavaScript Interop
Widget Modules: Implementation Specifications
Migration Strategy: Execution Order
Conclusion
Build-Time Registry Generation
Configuration Validation & Lifecycles
Error Boundaries & SafeWidget Pattern
Performance Verification Protocol
1. Architecture & Substrate
1.1 NixOS Environment
The status bar is a Nix derivation. All dependencies must be contained within the closure. No reliance on mutable system state.
Table
Copy
Feature	Traditional Distro (Arch/Debian)	NixOS (Target)	Implication
Dependency Management	Mutable (apt/pacman)	Immutable (nix-store)	Reproducible builds guaranteed. Eliminates "works on my machine" failures.
GObject Introspection	System-wide, version drift	Pinned via Flakes	Enables 100% static type analysis.
Runtime Linking	LD_LIBRARY_PATH manipulation	RPATH baked into binary	Zero startup latency from dynamic linking search.
Configuration	Dotfiles scattered in $HOME	Declarative Home Manager	Configuration is code. State is monolithic and version-controlled.
Flake Dependency Alignment:
nix
Copy
# flake.nix
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    astal.url = "github:aylur/astal";
  };
  
  outputs = { self, nixpkgs, astal }: {
    # ...
    buildInputs = [
      pkgs.libadwaita
      pkgs.gtk4
      pkgs.gobject-introspection
      astal.packages.x86_64-linux.default
    ];
  };
}
1.2 Niri Compositor Topology
Niri uses an infinite horizontal strip for window placement, not discrete workspaces. The status bar must visualize this spatial relationship.
Problem: Traditional bars (Waybar, Eww) assume integer-based workspaces and cannot represent scroll position or overflow.
Solution: Render a visual minimap of the strip. Listen to WorkspaceChanged and WindowMoved events from the Niri IPC JSON-RPC stream to update in real-time.
1.3 Wayland Rendering Model
On Wayland, the status bar is a standard client. GTK4 uses GPU-accelerated Render Nodes, not Cairo contexts.
Key Difference: Widgets generate a scene graph sent directly to the GPU. This enables blur, opacity, and masking entirely on the GPU without CPU involvement.
Performance Impact: Essential for maintaining 60fps on high-DPI displays with complex layouts.
2. GTK4 Migration: Paradigm Shifts
2.1 Abolition of GtkContainer
GTK3 (Legacy):
Base class: GtkContainer
Layout logic: Hardcoded in size_allocate
Child properties: Stored on the parent container
Drawing: GtkWidget::draw (Cairo context)
GTK4 (Modern):
Base class: GtkWidget
Layout logic: Delegated to GtkLayoutManager
Child properties: Scoped to GtkLayoutChild objects
Drawing: GtkWidget::snapshot (Render Nodes)
Migration Pattern:
TypeScript
Copy
// GTK3: Incorrect
const box = new Gtk.Box({ spacing: 12 });
box.pack_start(child, true, true, 0);

// GTK4: Correct
const layout = new Gtk.BoxLayout({ spacing: 12 });
widget.set_layout_manager(layout);
// Child properties set via layout child object
2.2 Event Controller Model
GTK3 signals (button-press-event) are removed. GTK4 requires explicit GtkEventController attachment.
Migration Pattern:
TypeScript
Copy
// GTK3: Incorrect
widget.connect('button-press-event', (widget, event) => { ... });

// GTK4: Correct
const clickController = new Gtk.GestureClick();
clickController.connect('pressed', (gesture, n_press, x, y) => { ... });
widget.add_controller(clickController);
Benefit: Separates input processing from widget logic. Enables complex behaviors (hover, long-press) without subclassing.
2.3 Astal as a GObject Factory
Astal is a thin GJS wrapper, not a reactive framework like React. JSX creates GObjects, not DOM nodes.
Discipline: Once a widget is instantiated, mutate properties directly. Do not re-render the tree. Astal components are factories, not virtual DOM nodes.
3. Mathematical Layout: ConstraintShell
3.1 Constraint Theory
Constraints are linear equations based on the Cassowary solver:
y=m⋅x+c 
Target Attribute (y): e.g., button.start
Source Attribute (x): e.g., super.start
Multiplier (m): Scaling factor
Constant (c): Offset
3.2 Modular Scale
All dimensions derived from base unit u :
u=12px (typographic line height) 
Scale ratio: 1.5 (Perfect Fifth)
Table
Copy
Level	Calculation	Value	Usage
0	12×1.5 
0
 	12px	Base margin
1	12×1.5 
1
 	18px	Icon size
2	12×1.5 
2
 	27px	Widget height
3	12×1.5 
3
 	40.5≈40px	Bar height
All VFL spacing must reference these integer constants.
3.3 Visual Format Language (VFL)
Master Layout String:
H:|-[Workspaces]-(>=0)-[Clock(==200)]-(>=0)-[Tray]-|
Analysis:
|-: Workspaces pinned to left edge with standard padding (u=12 px)
-: Scalable spacer with minimum width 0
[Clock(==200)]: Clock widget with fixed width 200px
-: Second spacer width equals first spacer (implicit equality)
-|: Tray pinned to right edge
Mathematical Proof of Centering:
If LeftSpacer == RightSpacer and Clock.width is constant, then Clock.center_x == Super.center_x regardless of left/right widget width.
3.4 ConstraintShell Implementation
TypeScript
Copy
import { Gtk, GObject, astalify } from 'astal/gtk4';

class ConstraintShell extends Gtk.Widget {
    static {
        GObject.registerClass({
            GTypeName: 'ConstraintShell',
        }, this);
    }

    constructor() {
        super();
        // Inject ConstraintLayout
        const layout = new Gtk.ConstraintLayout();
        this.set_layout_manager(layout);
    }

    public setConstraints(vfl_list: string[], views: Record<string, Gtk.Widget>) {
        const layout = this.get_layout_manager() as Gtk.ConstraintLayout;
        
        // GTK4 does not provide a constraint clear API.
        // Manual state management is required for dynamic re-layouts.
        
        for (const vfl of vfl_list) {
            layout.add_constraints_from_description(
                [vfl],
                12, // hspacing = $u$
                12, // vspacing = $u$
                views,
                null
            );
        }
    }
}

export const Shell = astalify(ConstraintShell);
4. Niri IPC Bridge: Native Socket Client
4.1 Protocol Specification
Socket Path: $NIRI_SOCKET (Unix Domain Socket)
Protocol: JSON-RPC 2.0 (newline-delimited)
Message Types:
Request/Response:
JSON
Copy
--> {"jsonrpc":"2.0","method":"GenericMethod","id":1}
<-- {"jsonrpc":"2.0","result":{...},"id":1}
Event Stream:
JSON
Copy
<-- {"jsonrpc":"2.0","method":"Event","params":{"WorkspaceChanged":{...}}}
4.2 Implementation: NiriService
TypeScript
Copy
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';

interface NiriWorkspaceEvent {
    WorkspaceActivated: { id: number; focused: boolean; };
}

class NiriService extends GObject.Object {
    static {
        GObject.registerClass({
            Signals: {
                'workspace-active': { param_types: [GObject.TYPE_UINT] },
                'windows-changed': {},
            },
        }, this);
    }

    private _client: Gio.SocketClient;
    private _conn: Gio.SocketConnection | null = null;
    private _inputStream: Gio.DataInputStream | null = null;
    private _encoder = new TextEncoder();

    constructor() {
        super();
        this._client = new Gio.SocketClient();
        this._connect();
    }

    private async _connect() {
        const socketPath = GLib.getenv("NIRI_SOCKET");
        if (!socketPath) return;

        const address = new Gio.UnixSocketAddress({ path: socketPath });
        
        try {
            this._conn = await new Promise((resolve, reject) => {
                this._client.connect_async(address, null, (obj, res) => {
                    try { resolve(this._client.connect_finish(res)); } 
                    catch (e) { reject(e); }
                });
            });

            if (!this._conn) return;

            this._inputStream = new Gio.DataInputStream({
                base_stream: this._conn.get_input_stream(),
                close_base_stream: true
            });

            this._readLoop();
            this._send('EventStream'); // Initiate event stream
            
        } catch (e) {
            console.error("Niri Connection Failed", e);
        }
    }

    private _send(method: string, params: any = null) {
        if (!this._conn) return;
        const msg = JSON.stringify({
            jsonrpc: "2.0",
            method: method,
            params: params,
            id: Math.floor(Math.random() * 1000)
        }) + "\n"; // Newline termination required
        
        const out = this._conn.get_output_stream();
        out.write_async(this._encoder.encode(msg), GLib.PRIORITY_DEFAULT, null, null);
    }

    private _readLoop() {
        if (!this._inputStream) return;

        // Async recursion is stack-safe. Callback fires from GLib Main Loop, not call stack.
        this._inputStream.read_line_async(GLib.PRIORITY_DEFAULT, null, (stream, res) => {
            try {
                const [line, len] = this._inputStream!.read_line_finish_utf8(res);
                
                if (line === null) { /* Stream closed */ return; }
                if (len > 0) { this._handleMessage(line); }
                
                this._readLoop(); // Recurse to maintain event stream
            } catch (e) {
                console.error("Read Error", e);
            }
        });
    }

    private _handleMessage(json: string) {
        try {
            const data = JSON.parse(json);
            if (data.Change?.WorkspaceActivated) {
                this.emit('workspace-active', data.Change.WorkspaceActivated.id);
            }
            // ... handle WindowOpened, WindowClosed, etc.
        } catch (e) {
            console.error("JSON Parse Error", e);
        }
    }
}

export const Niri = new NiriService();
Stack Safety Note: The _readLoop recursion is safe because read_line_async callbacks execute on the GLib Main Loop event queue, not the native call stack. This creates an infinite loop with zero stack depth accumulation.
5. Memory Safety: GObject/JavaScript Interop
5.1 Toggle Reference Cycle
Mechanism:
JS wrapper object holds reference to C GObject.
C GObject holds "toggle reference" to JS wrapper (to invoke JS callbacks).
If a signal callback captures the widget, a strong reference cycle forms.
GJS Cycle Collector often fails to break these cycles.
5.2 Unsafe vs. Safe Binding Patterns
UNSAFE (Leaks):
TypeScript
Copy
const myVar = Variable(0);
widget.hook(myVar, (self, value) => {
    // Closure captures 'self'
    // myVar holds closure
    // widget holds myVar (via hook)
    // CYCLE: widget -> myVar -> closure -> self (widget)
    self.label = value.toString();
});
SAFE (Explicit Disconnect):
TypeScript
Copy
// Store connection ID
const signalId = Niri.connect('workspace-active', (_, id) => {
    // Logic
});

// Sever link on widget destruction
widget.connect('destroy', () => {
    Niri.disconnect(signalId);
});
5.3 Verification: Heapgraph Profiling
Methodology:
bash
Copy
# Terminal 1: Start bar with debug output
GJS_DEBUG_TOPICS=JS LOG GJS_DEBUG_OUTPUT=stderr gjs -m bundle.js

# Terminal 2: Dump heap before stress test
gjs-console -c 'imports.heapgraph.dumpHeap("before.heapsnapshot")'

# Perform 100 workspace switches (automated or manual)

# Terminal 2: Dump heap after
gjs-console -c 'imports.heapgraph.dumpHeap("after.heapsnapshot")'

# Parse with heapgraph tool
gjs-console -c 'imports.heapgraph.showGrowth("before.heapsnapshot", "after.heapsnapshot")'
Acceptance Criteria: Object count for any widget type must not increase after repeated state changes.
6. Widget Modules: Implementation Specifications
6.1 Module: Niri Workspaces (Strip Visualizer)
Concept: Interactive minimap of Niri's infinite strip.
Implementation:
Container: GtkFlowBox (handles natural wrap if Niri configuration enables it)
Children: One widget per workspace, generated from Workspaces IPC response
Active State: 1px solid border (GPU render node)
css
Copy
.workspace-active {
    border-bottom: 2px solid @accent_color;
}
Updates: Listen to workspace-active and windows-changed signals. Use FlowBox.add/remove to mutate, never rebuild the entire tree.
Rationale: Blur shaders for "glow" effects drop 4K frame rate below 60fps. Solid borders render via border nodes in the GPU scene graph.
6.2 Module: Zero-Overhead System Monitor
Source: Direct read from /proc/stat via Gio.File.
Polling Interval: 2000ms
Rationale: <1000ms causes perceptible jitter; >5000ms feels unresponsive. 2000ms provides smoothed trend without distraction.
Parsing Algorithm:
TypeScript
Copy
const file = Gio.File.new_for_path('/proc/stat');
const [contents] = await file.load_contents_async(null);
const lines = new TextDecoder().decode(contents).split('\n');
const cpuLine = lines.find(l => l.startsWith('cpu '))!.split(/\s+/);
const total = cpuLine.slice(1).reduce((a, b) => parseInt(a) + parseInt(b), 0);
const idle = parseInt(cpuLine[4]);
const usage = ((total - idle) / total * 100).toFixed(1);
Optimization: No regex. Use String.split() and integer arithmetic to bypass libc overhead.
6.3 Module: Status Notifier (Tray)
Style: Brutalist grayscale until interaction.
Implementation:
css
Copy
/* Global CSS in Astal */
<style>
    {`
        .tray-item image {
            -gtk-icon-filter: grayscale(100%) contrast(1.2);
            transition: 200ms -gtk-icon-filter;
        }
        .tray-item:hover image {
            -gtk-icon-filter: none;
        }
    `}
</style>
Rationale: Forces visual consistency across third-party icons (Steam, Discord, NetworkManager). Color restoration on hover provides interaction feedback without permanent visual noise.
7. Migration Strategy: Execution Order
7.1 Step 1: Dependency Alignment
Ensure flake.nix pins astal, gtk4, libadwaita, and gobject-introspection to compatible versions. Build must succeed in a pure nix-shell.
7.2 Step 2: Logic Port
Rewrite all niri msg shell scripts as TypeScript classes using NiriService pattern.
Verify event stream in isolation: console.log all WorkspaceActivated and WindowMoved events.
Implement error handling: socket disconnects, JSON parse failures must be caught and reconnection attempted.
7.3 Step 3: Layout Port
Design grid on paper. Define modular scale constants in src/theme/scale.ts.
Write VFL strings for all container states.
Implement ConstraintShell with placeholder GtkLabel widgets only.
Verify centering and edge-pinning at multiple window widths. Do not proceed until constraints are mathematically correct.
7.4 Step 4: Widget Port
Migrate each GTK3 widget to GTK4 equivalent.
Critical Change: widget.show_all() is removed. Widgets are visible by default. Use widget.visible = false explicitly to hide.
Apply CSS. GTK4 CSS is stricter: -gtk-outline-radius removed; use border-radius.
Connect signals following Safe Pattern from Section 5.2. Store all connection IDs.
8. Conclusion
This specification defines a status bar architecture that:
Maps TypeScript directly to GPU render nodes via GTK4.
Uses Cassowary constraints for deterministic, resolution-independent layout.
Implements a native, zero-copy Niri IPC client.
Enforces memory safety through explicit lifecycle management.
Accesses kernel metrics without intermediate libraries.
All implementation must adhere to the patterns herein. Deviation requires architectural review.
9. Build-Time Registry Generation
9.1 The Generated Citadel Principle
Dynamic module loading violates the hermetic seal. All widget references must be resolved at compile time.
Mechanism:
Build Script: scripts/gen-registry.ts scans src/widgets/ directory at build time.
Static Mapping: Generates src/registry.ts containing:
TypeScript
Copy
export const WIDGET_MAP = {
    "clock": Clock,
    "workspaces": Workspaces,
    "media": MediaPro,
} as const;
Compile-Time Resolution: Application imports from registry.ts. No import() expressions remain.
Bundle Safety: ags bundle produces a single bundle.js with all dependencies embedded.
Nix Integration:
nix
Copy
# flake.nix
buildPhase = ''
  ${pkgs.nodejs}/bin/node scripts/gen-registry.ts
  ags bundle app.tsx bundle.js
'';
Verification: strings bundle.js | grep "import(" must return empty.
Rationale: If a resource cannot be resolved at build time, it does not exist. This prevents runtime filesystem access crashes.
10. Configuration Validation & Lifecycles
10.1 ConfigAdapter: The Gatekeeper
All state mutations must flow through a validated pipeline.
Implementation:
TypeScript
Copy
// src/services/ConfigAdapter.ts
import { z } from 'zod';
import Gio from 'gi://Gio';

const ConfigSchema = z.object({
    layout: z.object({
        barHeight: z.number().min(20).max(100),
    }),
    appearance: z.object({
        colors: z.record(z.string().regex(/^#[0-9A-F]{6}$/i)),
    }),
});

const SAFE_CONFIG = ConfigSchema.parse({
    layout: { barHeight: 40 },
    appearance: { colors: { primary: '#FF3355' } },
});

export class ConfigAdapter extends GObject.Object {
    static { GObject.registerClass({ Signals: { 'updated': {} } }, this); }
    
    private _file: Gio.File;
    private _monitor: Gio.FileMonitor;
    
    constructor(path: string) {
        super();
        this._file = Gio.File.new_for_path(path);
        this._monitor = this._file.monitor(Gio.FileMonitorFlags.NONE, null);
        this._monitor.connect('changed', this._onChange.bind(this));
    }
    
    private _onChange() {
        // 50ms debounce for atomic writes
        Utils.timeout(50, () => {
            try {
                const [contents] = this._file.load_contents(null);
                const config = ConfigSchema.parse(JSON.parse(contents));
                this.emit('updated', config);
            } catch (e) {
                console.error('Config invalid, using fallback', e);
                this.emit('updated', SAFE_CONFIG);
            }
        });
    }
}
10.2 CssInjectionService: Hot Reload without Recreation
Micro-updates (colors, spacing) must not trigger full bar recreation.
Implementation:
TypeScript
Copy
// src/services/CssInjectionService.ts
export class CssInjectionService {
    private _provider = new Gtk.CssProvider();
    
    constructor() {
        Gtk.StyleContext.add_provider_for_display(
            Gdk.Display.get_default()!,
            this._provider,
            Gtk.STYLE_PROVIDER_PRIORITY_USER
        );
    }
    
    public inject(css: string) {
        this._provider.load_from_data(css);
    }
}
Dynamic Reload Flow:
Edit default.toml → File monitor triggers
ConfigAdapter validates → Emits updated signal
CssInjectionService generates new :root variables → Injects via load_from_data()
GTK4 re-evaluates CSS without widget tree mutation
Macro-Update Rule: If barHeight changes, destroy and recreate the bar. This forces fresh Wayland exclusive zone negotiation.
Rationale: Destruction is cheaper than desynchronization. A micro-flicker is acceptable for structural changes.
11. Error Boundaries & SafeWidget Pattern
11.1 SafeWidget: Containment of Chaos
A widget crash must not propagate to the bar. Implement error boundaries at the composition root.
Pattern:
TypeScript
Copy
// src/components/SafeWidget.tsx
function SafeWidget({ component: C, props, fallback = "ERROR" }: SafeProps) {
    try {
        return <C {...props} />;
    } catch (e) {
        console.error(`Widget Crash: ${e}`);
        // Return minimal error pill to preserve layout
        return <label label={fallback} className="error-widget" />;
    }
}

// Usage in bar composition
<ConstraintShell>
    {config.left.map(id => 
        <SafeWidget component={WIDGET_MAP[id]} props={{}} />
    )}
</ConstraintShell>
Requirements:
fallback must be a fixed-size widget (e.g., 40px label) to prevent layout collapse.
All WIDGET_MAP components must be pure functions; side effects belong in services.
Crash logs must include widget ID and config snapshot for reproducibility.
Rationale: The UI is a projection of state (Bible 1.1). A crashing widget is a corrupted projection—replace it with a safe placeholder rather than desyncing the entire bar.
12. Performance Verification Protocol
12.1 Automated Performance Suite
All builds must pass these gates before merge.
Test 1: Frame Budget
bash
Copy
# Run bar with GSK_RENDERER=ngl (GPU)
GSK_RENDERER=ngl gjs -m bundle.js

# In separate terminal, measure frame time
dtrace -n 'gtk4:gtk_widget_snapshot_exit { @ = quantize(arg1); }' -c 'pkill -SIGUSR1 gjs'
Acceptance: 95th percentile < 16ms.
Test 2: GC Pressure
TypeScript
Copy
// In bar: Add debug trigger
Niri.connect('workspace-active', () => {
    if (global.gc) global.gc(); // Force GC
});
Methodology:
Perform 100 workspace switches.
Measure heap growth: process.memoryUsage().heapUsed.
Acceptance: Growth < 1MB (no leak).
Test 3: Memory Leak Detection
bash
Copy
# Dump heap before/after stress test
gjs-console -c 'imports.heapgraph.dumpHeap("before.heapsnapshot")'
# ... perform 100 widget additions/removals ...
gjs-console -c 'imports.heapgraph.dumpHeap("after.heapsnapshot")'

# Parse with heapgraph tool
gjs-console -c 'imports.heapgraph.showGrowth("before.heapsnapshot", "after.heapsnapshot")'
Acceptance: No growth in GtkLabel, GtkBox, or widget-specific types.
Test 4: IPC Latency
TypeScript
Copy
// In NiriService, add timestamp tracking
private _handleMessage(json: string) {
    const latency = Date.now() - JSON.parse(json).ts;
    if (latency > 50) console.warn(`IPC latency: ${latency}ms`);
}
Acceptance: Event-to-render latency < 50ms (human perception threshold).
Rationale: "Brutalist Efficiency" is not subjective. It is measured, or it is fiction.
End of Specification