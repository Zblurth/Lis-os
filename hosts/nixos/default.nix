{ pkgs, inputs, ... }: # <--- 1. ADD 'inputs' HERE
{
  imports = [
    # --- External Modules ---
    inputs.stylix.nixosModules.stylix # <--- 2. ADD THIS LINE (Loads the Stylix software)

    # --- Hardware & Boot ---
    ./hardware.nix
    ../../modules/core/boot.nix
    ../../modules/core/hardware.nix
    ../../modules/core/drivers.nix

    # --- Core System ---
    ../../modules/core/system.nix
    ../../modules/core/user.nix
    ../../modules/core/security.nix
    ../../modules/core/network.nix
    ../../modules/core/services.nix
    ../../modules/core/packages.nix
    ../../modules/core/portals.nix
    ../../modules/core/fonts.nix
    # --- Desktop ---
    ../../modules/core/greetd.nix
    ../../modules/core/stylix.nix # (This is YOUR config for it)

    # --- Apps ---
    ../../modules/core/nh.nix
    ../../modules/core/steam.nix
  ];

  # --- Host Specific Configuration ---
  programs.niri.package = pkgs.niri;
}
