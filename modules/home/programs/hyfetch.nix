{ pkgs, ... }:
{
  # Ensure hyfetch is installed (redundant if checking packages.nix, but good for self-containment if desired,
  # though user prefers packages.nix for centralized list from protocol. We will just configure here.)

  # Hyfetch Config
  # "Modern Slayer" Interpretation:
  # - Demon Slayer inspired colors (Red/Orange/Black gradient)
  # - Clean layout

  # Hyfetch Template for Theme Engine
  # This places the template where the engine can find it.
  # The engine will then generate ~/.config/hyfetch.json with actual colors.
  xdg.configFile."theme-engine/templates/hyfetch.json".text = builtins.toJSON {
    preset = "";
    mode = "rgb";
    light_dark = "dark";
    lightness = 0.5;
    color_align = {
      mode = "horizontal";
      custom_colors = [
        "{ui_prim}"
        "{syn_acc}"
        "{ui_sec}"
        "{fg}"
      ];
      fore_back = null;
    };
    backend = "neofetch";
    args = null;
    distro = null;
    pride_month_shown = [ ];
    pride_month_disable = false;
  };
}
