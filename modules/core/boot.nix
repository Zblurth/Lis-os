{ pkgs, ... }:

{
  boot = {
    # Use LTS kernel for stability
    kernelPackages = pkgs.linuxPackages;

    # --- CLEANUP: Removed initrd modules ---
    # We let hosts/nixos/hardware.nix handle "usbhid" and "xhci".
    # Defining them here creates redundancy and conflicts.

    # Bootloader
    loader.systemd-boot.enable = true;
    loader.efi.canTouchEfiVariables = true;

    # Plymouth (Boot splash)
    plymouth.enable = true;
  };
}
