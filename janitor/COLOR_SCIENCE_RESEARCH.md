# Advanced Color Science Research Report

> **Source:** Deep Research LLM  
> **Date:** 2025-12-18  
> **Status:** Ready for Implementation

## Executive Summary

A comprehensive framework for perceptual color theming via:
1. **Mood Manipulation** — Cinema-grade LUT + split-toning
2. **Saliency Extraction** — Spectral Residual + Weighted K-Means in Oklch
3. **Harmonic Templates** — Matsuda's 8 templates with rotational fitting
4. **WCAG Solver** — Binary search with gamut-aware chroma reduction

---

## Stage 1: Mood Manipulation

### Core Technique: Split Toning
- Shadow tint + Highlight tint (luminance-dependent blending)
- Uses smoothstep masks to avoid banding
- Implemented via 3D LUTs for O(1) per-pixel cost

### Math
```
Shadow Mask:  M_s(Y) = 1 - smoothstep(0, pivot, Y)
Highlight Mask: M_h(Y) = smoothstep(pivot, 1, Y)
```

---

## Stage 2: Perceptual Extraction

### Spectral Residual Saliency (Hou & Zhang 2007)
1. FFT → Log-spectrum → Subtract local average → Inverse FFT
2. Result: Saliency map where bright = visually important

### Weighted K-Means
- Weight each pixel by saliency score
- Cluster in **Oklab** (not sRGB)
- Anchor = centroid with highest aggregate saliency mass

---

## Stage 3: Harmonic Generation

### Matsuda's 8 Templates
| Type | Description | Sectors |
|:---|:---|:---|
| i | Monochromatic | 18° single |
| V | Broad Analogous | 93.6° |
| L | Orthogonal | 18° + 79.2° at 90° |
| I | Complementary | 18° + 18° at 180° |
| Y | Split Complementary | 93.6° + 18° at 180° |
| X | Double Complementary | 93.6° + 93.6° |
| T | Asymmetric Triad | 180° arc |

### Template Fitting
- Build weighted hue histogram from clusters
- Sweep all templates × all rotations
- Select (template, rotation) that minimizes exclusion cost

---

## Stage 4: Accessibility Solver

### WCAG Binary Search
1. Determine search direction (lighter or darker)
2. Binary search for L that achieves 4.5:1 contrast
3. If out-of-gamut: reduce chroma (not clip)
4. **Hue Locking:** Never shift hue for semantics

---

## Implementation Files

| Module | Purpose |
|:---|:---|
| `mood.py` | LUT generation, split-toning, contrast/saturation |
| `extraction.py` | Saliency map, weighted K-Means, anchor selection |
| `generator.py` | Template fitting, semantic color derivation |
| `solver.py` | WCAG constraint solving, gamut mapping |

---

## Dependencies Required

```nix
magicianEnv = pkgs.python3.withPackages (ps: [
  ps.pillow
  ps.coloraide
  ps.blake3
  ps.numpy
  ps.opencv4      # Saliency + FFT
  ps.scikit-learn # KMeans
  ps.scipy        # Optimization (optional)
]);
```

---

## Deviations from Original Request

| Our Request | Report's Approach | Verdict |
|:---|:---|:---|
| K=8 clusters | K=5 in example | Config param, easy to change |
| 10 accent candidates | 5 clusters shown | Increase K, done |
| Semantic A/B/Auto | "Hue Locking" only | Simpler, may be sufficient |
| gowall-style mood | LUT + split-toning | ✅ Same concept, better math |

---

## Citations Index

- [2] Oklab perception model
- [4] Oklch derivation
- [7] Hue uniformity in Oklch
- [14] Split-toning in photography
- [20] 3D LUT implementation
- [23] Spectral Residual Saliency
- [26] Weighted K-Means
- [30] Matsuda Harmonic Templates
- [35] WCAG binary search solving
