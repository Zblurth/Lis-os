# Deep Research Prompt: Next-Generation Perceptual Color Theming

## Context

I have a Python theme engine ("Magician") that generates UI color palettes from wallpaper images. It runs on NixOS using the `coloraide` library in **Oklch** color space. 

**Current Performance:** ~0.7s execution (cached).

**Current Problems:**
1. **Anchor Extraction is Primitive** — Uses `Chroma × log(Frequency)`, biased toward large dull backgrounds (beige walls, blue skies) instead of perceptually salient subjects.
2. **Palette Generation is Hardcoded** — Fixed constants like `hue_fence: 25`, `target_L: 0.26`, harmonic poles at 90°/270°.
3. **No Multi-Color Extraction** — Only one anchor is extracted; accent colors are mathematically derived, not discovered from the image.

---

## Goals

Design a **zero-hardcoded, math-driven** color theming pipeline with three stages:

### Stage 1: Mood as Wallpaper Manipulation

Before extraction, apply a **mood filter** to the wallpaper image itself:

- `deep`: Lower brightness, shift shadows cool (blue), reduce highlights
- `pastel`: Increase brightness, reduce chroma, add warmth
- `atmospheric`: Increase contrast, vignette, cool shadows

**Research Questions:**
1. What image manipulations create mood perception? Reference cinema color grading, LUTs, split-toning.
2. How do tools like [Gowall](https://github.com/Achno/gowall) implement theme-based recoloring?
3. How to implement in Python with Pillow/OpenCV?

### Stage 2: Perceptual Color Extraction

Extract the **true color profile** of the (mood-modified) wallpaper:

- **Primary Anchor:** The color the human brain perceives as dominant (saliency-weighted, not frequency-based)
- **Accent Pool:** 8 cluster centroids ranked by Saliency Mass
- **Smart Filtering:** Discard accents that are:
  - Too similar (Delta-E < threshold)
  - Hue conflicts (clashing angles)
  - Fail WCAG contrast after adjustment

**Algorithm:** Spectral Residual Saliency → Weighted K-Means (K=8) in Oklch

**Research Questions:**
1. What's the optimal saliency algorithm? Spectral Residual (Hou & Zhang 2007)? GBVS? OpenCV's built-in?
2. How to weight "visual importance" — by area, chroma, edge proximity, or combination?
3. Which color space for clustering: Oklch, CAM16-UCS, Jzazbz?
4. How to define "too similar" and "clashing" mathematically?

### Stage 3: Harmonic Palette Generation

Generate the full UI palette using **discovered relationships**, not hardcoded angles:

**Matsuda Harmonic Template Fitting:**
- Fit templates (monochromatic, complementary, split-comp, triadic) to the saliency-weighted hue histogram
- Discover the image's natural harmonic structure
- Use discovered poles for derived colors instead of fixed 90°/270°

**WCAG Constraint Solver:**
- Binary search for optimal lightness to achieve 4.5:1 contrast
- Gamut mapping via chroma reduction (not clipping)

**Semantic Color Harmonization:**
- Shift error/warning/success hues toward anchor
- Clamp to "safe zones" (Red: 10°-45°, Green: 130°-170°, Yellow: 80°-110°)
- Algorithm chooses between:
  - **(A) Full:** Shift hue + adjust L/C for harmony
  - **(B) Hybrid:** Shift hue only, keep L/C fixed for recognition
  - Decision based on: Does (A) maintain WCAG AND stay recognizable?

**Research Questions:**
1. How to detect natural harmonic relationships within extracted colors?
2. What's the formula to derive optimal background lightness that maximizes contrast while preserving vibe?
3. How to mathematically ensure readability while preserving wallpaper character?
4. What Delta-E metric is best: CMC, CIE2000, or Oklch Euclidean?

---

## Constraints

- **No hardcoded magic numbers** — All constants derived from input or color science
- **Performance secondary** — Okay if extraction takes 2-3s; we cache results
- **Deterministic** — Same input → same output for caching
- **Python implementation** — Use `coloraide`, `opencv-python`, `scikit-learn`, `Pillow`

---

## Expected Output Format

### 1. Mood Manipulation Module
- Pseudocode for each mood filter
- Pillow/OpenCV implementation approach
- Before/after examples

### 2. Extraction Algorithm
- Step-by-step with formulas
- Saliency weighting math
- Cluster filtering criteria

### 3. Palette Generation Algorithm  
- Matsuda template fitting procedure
- WCAG solver pseudocode
- Semantic harmonization decision tree

### 4. References
- Color science papers cited
- Trade-off analysis where approximations are made

---

## Reference: Current Code Structure

```
modules/home/theme/core/
├── magician.py      # CLI entry, orchestration
├── extraction.py    # Currently: histogram + Chroma×log(freq)
├── generator.py     # MoodGenerator class, hardcoded constants
├── color.py         # coloraide wrappers
└── renderer.py      # Template substitution
```

The new system should produce drop-in replacements for `extraction.py` and `generator.py`, plus a new `mood.py` for wallpaper manipulation.
