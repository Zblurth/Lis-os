{ pkgs, inputs, ... }: # <--- 1. ADD 'inputs' HERE
{
  imports = [
    # --- External Modules ---
    inputs.stylix.nixosModules.stylix
    inputs.chaotic.nixosModules.default

    # --- Hardware & Boot ---
    ./hardware.nix
    ../modules/core/boot.nix
    ../modules/core/hardware.nix
    ../modules/core/drivers.nix

    # --- Core System ---
    ../modules/core/system.nix
    ../modules/core/user.nix
    ../modules/core/security.nix
    ../modules/core/network.nix
    ../modules/core/services.nix
    ../modules/core/packages.nix
    ../modules/core/portals.nix
    ../modules/core/fonts.nix
    ../modules/core/appimage.nix

    # --- Desktop ---
    ../modules/core/greetd.nix
    ../modules/core/stylix.nix

    # --- Apps ---
    ../modules/core/nh.nix
    ../modules/core/steam.nix

    # --- Virtualization (Arch testing) ---
    ../modules/core/virtualization.nix
  ];

  # --- Host Specific Configuration ---
  programs.niri.package = pkgs.niri;
}
