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
  terminal = "kitty";
  keyboardLayout = "us";
  consoleKeyMap = "us";

  # GPU IDs (for Prime)
  intelID = "PCI:0:2:0";
  nvidiaID = "PCI:1:0:0";

  # Core Features
  enableNFS = false;
  printEnable = false;
  thunarEnable = true;
  stylixEnable = true;

  # Optional Features
  gamingSupportEnable = false;
  flutterdevEnable = false;
  syncthingEnable = false;
  enableCommunicationApps = false;
  enableExtraBrowsers = false;
  enableProductivityApps = false;
  aiCodeEditorsEnable = false;

  # Desktop Environment
  enableHyprlock = false;

  # Bar/Shell Choice
  barChoice = "noctalia";
  defaultShell = "zsh";

  # Theming
  stylixImage = ../../wallpapers/Valley.jpg;
  animChoice = ../../modules/home/hyprland/animations-end4.nix;

  # Startup Applications
  startupApps = [ ];
}
