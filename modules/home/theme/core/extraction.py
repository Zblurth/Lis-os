"""
extraction.py — Color Science v2
Extracts perceptual anchor colors using Spectral Residual Saliency and Weighted K-Means.

Replaces the legacy histogram + frequency method.
"""
from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional
import cv2
import numpy as np
from sklearn.cluster import KMeans
from coloraide import Color

@dataclass
class ExtractionConfig:
    downsample_size: int = 128
    k_clusters: int = 8
    saliency_threshold: float = 0.15
    ignore_extremes: bool = True  # Ignore near-black/white

class SaliencyExtractor:
    """Implements Hou & Zhang's Spectral Residual Saliency detection."""
    
    def __init__(self, config: ExtractionConfig):
        self.config = config

    def get_saliency_map(self, img: np.ndarray) -> np.ndarray:
        """
        Compute saliency map from image.
        
        Args:
            img: Float32 RGB image (0-1 range) OR Uint8 RGB
            
        Returns:
            2D Float32 saliency map (0-1 range)
        """
        # Convert to grayscale Uint8 and resize for speed
        if img.dtype != np.uint8:
            src = (img * 255).astype(np.uint8)
        else:
            src = img
            
        if len(src.shape) == 3:
            gray = cv2.cvtColor(src, cv2.COLOR_RGB2GRAY)
        else:
            gray = src
            
        gray = cv2.resize(gray, (self.config.downsample_size, self.config.downsample_size))
        
        # FFT to Frequency Domain
        f = np.fft.fft2(gray)
        log_amplitude = np.log(np.abs(f) + 1e-9)
        phase = np.angle(f)
        
        # Spectral Residual: LogSpectrum - LocalAverage(LogSpectrum)
        # We use a 3x3 box filter (blur) to approximate local average
        avg_log = cv2.blur(log_amplitude, (3, 3))
        spectral_residual = log_amplitude - avg_log
        
        # Inverse FFT to get Saliency Map
        saliency = np.abs(np.fft.ifft2(np.exp(spectral_residual + 1j * phase)))
        
        # Post-processing: Square to emphasize peaks and smooth
        saliency = saliency ** 2
        saliency = cv2.GaussianBlur(saliency, (9, 9), 2.5)
        
        # Normalize to 0-1
        min_val, max_val = saliency.min(), saliency.max()
        if max_val != min_val:
            saliency = (saliency - min_val) / (max_val - min_val)
            
        return saliency

class PerceptualExtractor:
    """Extracts palette using saliency-weighted K-Means in Oklab."""
    
    def __init__(self, config: ExtractionConfig = ExtractionConfig()):
        self.config = config
        self.saliency = SaliencyExtractor(config)

    def extract(self, image_source) -> Dict:
        """
        Extract anchor and palette from image.
        
        Args:
            image_source: File path (str) OR Numpy array (RGB or BGR)
            
        Returns:
            dict containing anchor, palette, weights
        """
        # Load image if path
        if isinstance(image_source, str):
            img_bgr = cv2.imread(image_source)
            if img_bgr is None:
                return {"anchor": "#000000", "palette": ["#000000"], "weights": [1.0]}
            img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        else:
            # Assume input is numpy array
            # If float (0-1) from MoodEngine, convert to uint8 0-255 for OpenCV processing
            if image_source.dtype == np.float32 or image_source.dtype == np.float64:
                # Expect RGB 0-1
                img_rgb = (image_source * 255).astype(np.uint8)
            else:
                # Assume Uint8 RGB (Standard Pillow/OpenCV)
                img_rgb = image_source
        
        # 1. Get Saliency Map
        weights_map = self.saliency.get_saliency_map(img_rgb)
        
        # 2. Reshape Image to Match Saliency
        # Downsample image to same size as saliency map for clustering
        small_img = cv2.resize(img_rgb, (weights_map.shape[1], weights_map.shape[0]), interpolation=cv2.INTER_AREA)
        
        # Normalize to 0-1 float for color conversion
        pixels_rgb = small_img.astype(np.float32) / 255.0
        
        # Flatten
        pixels_flat = pixels_rgb.reshape(-1, 3)
        weights_flat = weights_map.reshape(-1)
        
        # 3. Filter Low Saliency & Extremes (Noise Reduction)
        valid_mask = weights_flat > self.config.saliency_threshold
        
        if self.config.ignore_extremes:
            # Filter near-black (L < 5%) and near-white (L > 97%)
            # Approx Luma for speed: 0.299R + 0.587G + 0.114B
            luma = 0.299 * pixels_flat[:, 0] + 0.587 * pixels_flat[:, 1] + 0.114 * pixels_flat[:, 2]
            extreme_mask = (luma > 0.05) & (luma < 0.97)
            valid_mask = valid_mask & extreme_mask
        
        # If we filtered everything (e.g. solid color image), fallback to all pixels
        if np.sum(valid_mask) < self.config.k_clusters:
            valid_mask = np.ones_like(weights_flat, dtype=bool)

        pixels_valid = pixels_flat[valid_mask]
        weights_valid = weights_flat[valid_mask]
        
        # 4. Convert to Oklab
        # We perform clustering in Oklab for perceptual uniformity
        pixels_oklab = self._rgb_to_oklab_batch(pixels_valid)
        
        # 5. Weighted K-Means
        kmeans = KMeans(
            n_clusters=self.config.k_clusters,
            init='k-means++',
            n_init=3, # Lower n_init for speed, 3 is usually enough
            random_state=42
        )
        kmeans.fit(pixels_oklab, sample_weight=weights_valid)
        
        centers_oklab = kmeans.cluster_centers_
        labels = kmeans.labels_
        
        # 6. Rank Clusters by Saliency Mass
        # Which cluster captured the most "visual attention"?
        cluster_scores = np.zeros(self.config.k_clusters)
        for i in range(self.config.k_clusters):
            # Sum of weights for all pixels belonging to this cluster
            cluster_scores[i] = np.sum(weights_valid[labels == i])
            
        # Sort by score descending
        sorted_indices = np.argsort(cluster_scores)[::-1]
        
        sorted_centers = centers_oklab[sorted_indices]
        sorted_scores = cluster_scores[sorted_indices]
        
        # Convert back to Hex
        palette_hex = [self._oklab_to_hex(c) for c in sorted_centers]
        
        return {
            "anchor": palette_hex[0],  # Most salient cluster
            "palette": palette_hex,    # All candidates
            "weights": sorted_scores.tolist()
        }

    def _rgb_to_oklab_batch(self, rgb_arr: np.ndarray) -> np.ndarray:
        """Batch convert RGB (0-1) to Oklab using coloraide."""
        # Note: Ideally we'd use a numpy vectorized formula here for speed.
        # For now, we use a simple loop or Color object. 
        # Since we effectively downsampled to 128x128 (~16k pixels) and filtered,
        # this loop is acceptable (< 100ms).
        oklab_arr = []
        for rgb in rgb_arr:
            # Color expects 0-1 for RGB
            c = Color('srgb', rgb)
            oklab = c.convert('oklab')
            oklab_arr.append([oklab['l'], oklab['a'], oklab['b']])
        return np.array(oklab_arr)
        
    def _oklab_to_hex(self, oklab_list: np.ndarray) -> str:
        """Convert single Oklab [l, a, b] to Hex string."""
        # Ensure we pass a list, not numpy array
        params = [float(x) for x in oklab_list]
        c = Color('oklab', params)
        # Force conversion to sRGB and map gamut if needed
        if not c.in_gamut('srgb'):
            c.fit('srgb', method='lch-chroma')
        return c.convert('srgb').to_string(hex=True)


# Legacy Compatibility Wrapper
def extract_anchor(image_path: str, fallback_hex: str = None) -> str:
    """Drop-in replacement for the old function."""
    extractor = PerceptualExtractor()
    try:
        result = extractor.extract(image_path)
        return result["anchor"]
    except Exception as e:
        print(f"Extraction failed: {e}")
        return fallback_hex or "#000000"
