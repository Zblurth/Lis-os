"""
The "Mood Engine" (Data-Driven Generator)
Reads configuration from moods.json to determine color logic.
"""
import math
from typing import Dict, Any
from coloraide import Color

# Define Semantic Bases
SEMANTIC_BASES = {
    "red": Color("oklab", [0.65, 0.25, 0.08]),
    "green": Color("oklab", [0.70, 0.20, 0.40]),
    "yellow": Color("oklab", [0.75, 0.18, 0.17]),
    "blue": Color("oklab", [0.70, 0.22, -0.20])
}

class MoodGenerator:
    def __init__(self, anchor_hex: str, config: Dict[str, Any]):
        self.anchor = Color(anchor_hex).convert("oklab")
        self.anchor_hex = anchor_hex
        self.anchor_lch = self.anchor.convert("oklch")
        self.config = config
        
        # Temp Detection
        self.is_cool = self.anchor['b'] < 0.02
        
        # Adaptive Poles (Defaults if not in config)
        if self.is_cool:
            self.harmonic_pole = 270.0
            self.adaptive_shadow = "#1a1c2c"
        else:
            self.harmonic_pole = 90.0
            self.adaptive_shadow = "#a0826d"

    # ==========================================
    # BACKGROUND LOGIC
    # ==========================================
    def _generate_background(self) -> Color:
        cfg = self.config.get("background", {})
        algo = cfg.get("algo", "adaptive_shadow")
        target_L = cfg.get("target_L", 0.26)
        
        if algo == "adaptive_shadow":
            # Determine root
            root_hex = cfg.get("shadow_root", "adaptive")
            if root_hex == "adaptive":
                root_hex = self.adaptive_shadow
            
            shadow_root = Color(root_hex).convert("oklab")
            
            # Mix: mix_strength is Shadow amount? 
            # In config: "mix_strength": 0.30.
            # v5 logic was 70% Anchor / 30% Shadow.
            # So mix(anchor, 1.0 - strength)? No, mix(anchor, strength) mixes self with anchor.
            # shadow_root.mix(anchor, 1.0 - strength).
            
            strength = cfg.get("mix_strength", 0.30)
            anchor_ratio = 1.0 - strength
            
            base = shadow_root.mix(self.anchor, anchor_ratio, space="oklab")
            bg = base.set('lightness', target_L)
            
            # Inverse Warmth (Correction) for Dark Themes
            if target_L < 0.5:
                shift = cfg.get("warmth_boost", 0.015)
                if self.is_cool: bg.set('b', bg['b'] - shift/2)
                else: bg.set('b', bg['b'] + shift)
            
            # Chroma Compression
            bg_lch = bg.convert("oklch")
            l = bg_lch['lightness']
            if l > 0: bg_lch.set('chroma', bg_lch['chroma'] * math.sqrt(l))
            
            return bg_lch.convert("oklab")
            
        return self.anchor.clone().set('lightness', target_L)

    # ==========================================
    # HERO LOGIC
    # ==========================================
    def _generate_hero(self, bg: Color) -> Color:
        cfg = self.config.get("hero", {})
        algo = cfg.get("algo", "delta_e_loop")
        
        if algo == "delta_e_loop":
            target_delta = cfg.get("target_delta", 45)
            fence = cfg.get("hue_fence", 25)
            
            hero = self.anchor.clone().set('lightness', 0.65)
            anchor_h = self.anchor_lch['hue']
            
            # Initial Seed
            c_mag = math.sqrt(self.anchor['a']**2 + self.anchor['b']**2)
            log_boost = 1.0 + 0.4 * math.log1p(c_mag * 3.0)
            hero_lch = hero.convert("oklch")
            hero_lch.set('chroma', hero_lch['chroma'] * log_boost)
            hero = hero_lch.convert("oklab")
            
            for _ in range(20):
                if hero.delta_e(bg, method="cmc") >= target_delta: break
                
                hero.convert("oklch", in_place=True)
                hero.set('chroma', hero['chroma'] * 1.1)
                
                # Fencing
                curr_h = hero['hue']
                diff = curr_h - anchor_h
                while diff > 180: diff -= 360
                while diff < -180: diff += 360
                if abs(diff) > fence:
                    hero.set('hue', anchor_h + (fence if diff > 0 else -fence))
                    
                hero.convert("oklab", in_place=True)
                if math.sqrt(hero['a']**2 + hero['b']**2) > 0.50: break
            return hero
            
        elif algo == "log_boost_rotate":
            rotation = cfg.get("rotation", -15)
            
            c_mag = math.sqrt(self.anchor['a']**2 + self.anchor['b']**2)
            boost = 1.0 + 0.4 * math.log1p(c_mag * 3.0)
            new_a = self.anchor['a'] * boost
            new_b = self.anchor['b'] * boost
            c = Color('oklab', [0.65, new_a, new_b])
            
            c.convert("oklch", in_place=True)
            c.set('hue', c['hue'] + rotation)
            return c.convert("oklab")
            
        return self.anchor.clone()

    # ==========================================
    # TEXT LOGIC
    # ==========================================
    def _generate_text(self) -> Dict[str, Color]:
        cfg = self.config.get("text", {})
        algo = cfg.get("algo", "harmonized")
        
        if algo == "harmonized":
            drift = cfg.get("drift", 0.10)
            bias = cfg.get("warmth_bias", True)
            
            h = self.anchor_lch['hue']
            pole = self.harmonic_pole
            diff = pole - h
            while diff > 180: diff -= 360
            while diff < -180: diff += 360
            harmonized_h = h + (diff * drift)
            
            c_base = self.anchor_lch['chroma']
            
            def make(l, c_mult):
                c = Color("oklch", [l, c_base * c_mult, harmonized_h])
                c_lab = c.convert("oklab")
                if bias:
                    haze = 0.005 + (l * 0.025)
                    if self.is_cool: c_lab.set('b', c_lab['b'] - haze)
                    else: c_lab.set('b', c_lab['b'] + haze)
                return c_lab
            return {"fg": make(0.90, 0.10), "fg_dim": make(0.75, 0.10), "fg_muted": make(0.55, 0.05)}
            
        elif algo == "temp_inversion":
            shift = cfg.get("shift", 0.02)
            a = self.anchor['a'] * 0.1
            b = self.anchor['b'] * 0.1
            if self.is_cool: b += shift
            else: b -= shift
            
            def make(l): return Color('oklab', [l, a, b])
            return {"fg": make(0.90), "fg_dim": make(0.70), "fg_muted": make(0.55)}
            
        return {}

    # ==========================================
    # EXECUTE
    # ==========================================
    def generate(self) -> Dict[str, Any]:
        bg_lab = self._generate_background()
        hero_lab = self._generate_hero(bg_lab)
        txt = self._generate_text()
        
        # Derived
        bg_hex = bg_lab.convert("srgb").fit(method="lch-chroma").to_string(hex=True)
        hero_hex = hero_lab.convert("srgb").fit(method="lch-chroma").to_string(hex=True)
        
        # UI Sec: BG + Elevation
        ui_sec_lch = bg_lab.convert("oklch")
        ui_sec_lch.set('lightness', ui_sec_lch['lightness'] + 0.08)
        ui_sec_lch.set('chroma', ui_sec_lch['chroma'] * 0.90)
        ui_sec_hex = ui_sec_lch.convert("srgb").fit(method="lch-chroma").to_string(hex=True)
        
        # Semantics
        sem_map = {}
        for name, base in SEMANTIC_BASES.items():
            ac = self.anchor_lch['chroma']
            bc = base.convert("oklch")['chroma']
            ratio = ac / (ac + bc + 0.001)
            mixed = base.mix(self.anchor, ratio, space="oklab")
            m_lch = mixed.convert("oklch")
            # Harmonize
            h = m_lch['hue']
            pole = self.harmonic_pole
            diff = pole - h
            while diff > 180: diff -= 360
            while diff < -180: diff += 360
            m_lch.set('hue', h + (diff * 0.20))
            sem_map[f"sem_{name}"] = m_lch.convert("srgb").fit(method="lch-chroma").to_string(hex=True)

        # Syntax
        syn_key = self.anchor_lch.clone().set('lightness', 0.70)
        syn_key.set('chroma', syn_key['chroma'] * 1.2)
        syn_key_hex = syn_key.convert("srgb").fit(method="lch-chroma").to_string(hex=True)
        
        acc_h = self.anchor_lch['hue'] + 180
        syn_acc = Color("oklch", [0.68, self.anchor_lch['chroma'] * 1.1, acc_h]).convert("srgb").fit(method="lch-chroma").to_string(hex=True)
        
        # Bar BG
        bar_c = self.anchor.convert("srgb")
        bar_c.set('alpha', 0.85)
        bar_bg = bar_c.to_string(comma=True)

        def to_hex(c): return c.convert("srgb").fit(method="lch-chroma").to_string(hex=True)

        return {
            "colors": {
                "anchor": self.anchor_hex,
                "bg": bg_hex,
                "fg": to_hex(txt.get("fg", self.anchor)), # Safety get
                "fg_dim": to_hex(txt.get("fg_dim", self.anchor)),
                "fg_muted": to_hex(txt.get("fg_muted", self.anchor)),
                "ui_prim": hero_hex,
                "ui_sec": ui_sec_hex,
                
                **sem_map,
                "syn_key": syn_key_hex,
                "syn_fun": to_hex(syn_key.clone().set('hue', syn_key['hue'] + 30)),
                "syn_str": to_hex(syn_key.clone().set('hue', syn_key['hue'] - 30)),
                "syn_acc": syn_acc,
                
                "surface": bg_hex,
                "surfaceDarker": self.anchor_hex,
                "surfaceLighter": ui_sec_hex,
                "text": to_hex(txt.get("fg", self.anchor)),
                "textDim": to_hex(txt.get("fg_dim", self.anchor)),
                "textMuted": to_hex(txt.get("fg_muted", self.anchor)),
                
                "bar_bg": bar_bg
            }
        }

def generate_palette(anchor_hex: str, profile: Dict[str, Any]) -> Dict[str, Any]:
    # Determine Active Mood from profile/config
    # Profile structure: { "moods": { ... }, "active_mood": "adaptive" }
    
    active_mood_name = profile.get("active_mood", "adaptive")
    mood_config = profile.get("moods", {}).get(active_mood_name, {})
    
    # Fallback if config is empty
    if not mood_config:
        mood_config = {
            "background": { "algo": "adaptive_shadow", "mix_strength": 0.30, "target_L": 0.26 },
            "text": { "algo": "harmonized", "drift": 0.10, "warmth_bias": True },
            "hero": { "algo": "delta_e_loop", "target_delta": 45 }
        }
    
    gen = MoodGenerator(anchor_hex, mood_config)
    return gen.generate()