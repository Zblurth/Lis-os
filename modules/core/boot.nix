{ pkgs, ... }:

{
  boot = {
    # Use LTS kernel for stability
    kernelPackages = pkgs.linuxPackages_lts;

    # --- CLEANUP: Removed initrd modules ---
    # We let hosts/nixos/hardware.nix handle "usbhid" and "xhci".
    # Defining them here creates redundancy and conflicts.

    # Bootloader
    loader.systemd-boot.enable = true;
    loader.efi.canTouchEfiVariables = true;

    # Plymouth (Boot splash)
    plymouth.enable = true;

    # Appimage Support
    binfmt.registrations.appimage = {
      wrapInterpreterInShell = false;
      interpreter = "${pkgs.appimage-run}/bin/appimage-run";
      recognitionType = "magic";
      offset = 0;
      mask = ''\xff\xff\xff\xff\x00\x00\x00\x00\xff\xff\xff'';
      magicOrExtension = ''\x7fELF....AI\x02'';
    };
  };
}
