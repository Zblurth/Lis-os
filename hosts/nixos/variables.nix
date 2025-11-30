{
  # Git Configuration
  gitUsername = "lune";
  gitEmail = "lune@nixos";

  # System Configuration
  timeZone = "Europe/Paris";

  # Monitor Settings (update after installation for your displays)
  extraMonitorSettings = ''
    monitor=,preferred,auto,1
  '';

  # Waybar Settings
  clock24h = false;

  # Default Applications
  browser = "vivaldi";
  terminal = "kitty";
  keyboardLayout = "us";
  consoleKeyMap = "us";

  # For Nvidia Prime support (update if using nvidia-laptop profile)
  # Run 'lspci | grep VGA' to find your actual GPU IDs
  intelID = "PCI:0:2:0";
  nvidiaID = "PCI:1:0:0";

  # Core Features
  enableNFS = false;
  printEnable = false;
  thunarEnable = true;
  stylixEnable = true;

  # Optional Features (disabled for faster initial install)
  # You can enable these later by setting to true and rebuilding
  gamingSupportEnable = false; # Gaming controllers, gamescope, protonup-qt
  flutterdevEnable = false; # Flutter development environment
  syncthingEnable = false; # Syncthing file synchronization
  enableCommunicationApps = false; # Discord, Teams, Zoom, Telegram
  enableExtraBrowsers = false; # Vivaldi, Brave, Firefox, Chromium, Helium
  enableProductivityApps = false; # Obsidian, GNOME Boxes, QuickEmu
  aiCodeEditorsEnable = false; # Claude-code, gemini-cli, cursor

  # Desktop Environment
  enableHyprlock = false; # Set to false if using DMS/Noctalia lock screens

  # Bar/Shell Choice
  barChoice = "noctalia";

  # Shell Choice
  defaultShell = "zsh"; # Options: "fish" or "zsh"

  # Theming
  stylixImage = ../../wallpapers/Valley.jpg;
  #waybarChoice = ../../modules/home/waybar/waybar-ddubs.nix;  # Waybar temporarily disabled
  animChoice = ../../modules/home/hyprland/animations-end4.nix;

  # Startup Applications
  startupApps = [ ];
}
