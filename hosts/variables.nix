{
  # Git Configuration
  gitUsername = "lune";
  gitEmail = "lune@nixos";

  # System Configuration
  timeZone = "Europe/Paris";

  # --- Monitor Settings (Niri) ---
  # Replaced Hyprland syntax with Niri syntax
  monitorConfig = ''
    output "DP-2" {
        mode "3440x1440@100.000"
        scale 1.0
        position x=0 y=0
    }
  '';

  # Waybar Settings
  clock24h = false;

  # Default Applications
  browser = "vivaldi";
  terminal = "wezterm";
  keyboardLayout = "us";
  consoleKeyMap = "us";

  # Core Features
  thunarEnable = true;
  stylixEnable = true;

  # Bar/Shell Choice
  barChoice = "noctalia";
  defaultShell = "zsh";

  # Theming
  stylixImage = ../modules/home/theme/stylix/wallpaper.jpg;

  # Startup Applications
  startupApps = [ ];
}
