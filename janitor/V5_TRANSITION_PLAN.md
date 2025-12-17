# V5 Transition Plan
**Status:** READY FOR EXECUTION  
**Last Updated:** 2025-12-16

---

## Current State

| Component | Status |
|-----------|--------|
| Folder Structure | ✅ Clean (consolidated to `src/services/`) |
| Build | ✅ Passing |
| V5 Bible | ✅ Created (`janitor/ASTAL_V5_BIBLE.md`) |
| ConfigAdapter | ✅ Exists (needs schema hardening) |
| CssInjectionService | ✅ Exists (needs full variable coverage) |
| LayoutService | ⚠️ Contains deprecated methods |
| Registry | ⚠️ Manual (needs gen-registry.ts) |

---

## 🐛 Known Bugs

### 1. Media Widget: `[object Object]`
**File:** `widgets/Media.tsx:50,57`  
**Cause:** `maxWidthChars` receives a `Binding<number>` but expects `number`
```tsx
// ❌ Current
maxWidthChars={titleLimit}  // titleLimit is Binding<number>

// ✅ Fix
maxWidthChars={25}  // Static, or use .get() if dynamic needed
```

---

## 🔴 V5 Violations to Fix

### Phase 1: Config & Schema

| File | Issue | Fix |
|------|-------|-----|
| `default.toml` | Missing `[limits]` section | Add `mediaTitle`, `mediaArtist`, `windowTitle` keys |
| `ConfigAdapter.ts` | Schema doesn't define `layout.widgets.limits` | Add Zod schema for limits |

### Phase 2: CSS Injection Completion

| File | Issue | Fix |
|------|-------|-----|
| `CssInjectionService.ts` | Missing utility classes | Add `.gap-1`, `.gap-2` generation |
| `bar.css` | GTK3 incompatible CSS | Expand `var()` in shorthand properties |

### Phase 3: Widget Remediation (Math-in-TS Violations)

| Widget | Violation | Fix |
|--------|-----------|-----|
| `Audio.tsx` | `spacing={layout.U.as(...)}` | Use CSS class `.gap-1` |
| `ResourceUsage.tsx` | `spacing={layout.U.as(...)}` | Use CSS class `.gap-1` |
| `Tray.tsx` | `spacing={layout.U.as(...)}` | Use CSS class `.gap-1` |
| `Media.tsx` | Binding to `maxWidthChars` prop | Use static value or `.get()` |
| `DateTime.tsx` | Missing config path `widgets.clock.format` | Add to schema |
| `WindowTitle.tsx` | Missing config path `layout.widgets.limits` | Add to schema |

### Phase 4: LayoutService Gutting

| Method | Status | Action |
|--------|--------|--------|
| `P(x)` | Deprecated | DELETE (use CSS `--spacing-*`) |
| `Radius(x)` | Deprecated | DELETE (use CSS `--radius-*`) |
| `FontSize(x)` | Deprecated | DELETE (use CSS `--font-size`) |
| `barHeight` | Keep | Required for Window.heightRequest |
| `iconSize` | Keep | Required for Icon.pixel_size |
| `U` | Keep | Base unit for CSS math |

### Phase 5: Registry Generation

| Task | Status |
|------|--------|
| Create `scripts/gen-registry.ts` | [ ] TODO |
| Update `package.json` build script | [ ] TODO |
| Delete manual registry | [ ] TODO |

---

## 📋 Execution Checklist

### Pre-Flight
- [x] Folder structure cleaned
- [x] Build passing
- [x] V5 Bible created
- [x] User approval obtained ✅

### Phase 1: Config Foundation
- [x] Add `[limits]` section to `default.toml` (already existed, added windowTitle)
- [x] Add `[widgets.clock]` section to `default.toml`
- [x] Update Zod schema in `ConfigAdapter.ts`

### Phase 2: CSS System
- [x] Add gap utility classes (`.gap-1`, `.gap-2`, `.gap-half`)
- [ ] Fix bar.css shorthand property issues (deferred - works in GTK)
- [ ] Add missing CSS variables (if needed)

### Phase 3: Widget Fixes
- [x] Fix Media.tsx `[object Object]` bug
- [x] Remediate Audio.tsx spacing
- [x] Remediate ResourceUsage.tsx spacing
- [x] Remediate Tray.tsx spacing
- [x] Fix DateTime.tsx config path
- [x] Fix WindowTitle.tsx config path

### Phase 4: LayoutService Cleanup
- [ ] Remove P(), Radius(), FontSize() methods
- [ ] Update any remaining callers
- [ ] Verify bar still renders

### Phase 5: Registry Automation
- [ ] Create gen-registry.ts script
- [ ] Integrate into build pipeline
- [ ] Remove manual registry file

---

## ⚡ Quick Reference

**V5 Rules:**
1. No `spacing={layout.P(x)}` → Use CSS classes
2. No `borderRadius={layout.Radius(x)}` → Use `--radius-*` CSS vars
3. No Binding to integer-only props → Use `.get()` or static values
4. All visual values → Traceable to `default.toml`

**Allowed in LayoutService:**
- `barHeight` (Window.heightRequest)
- `iconSize` (Icon.pixel_size)
- `launcherGeometry` (complex grid math)

---

**Awaiting your "YES" to begin execution.**
