{ pkgs, ... }:
{
  boot = {
    # UPGRADE: Use the Zen Kernel (Optimized for Desktop/Gaming)
    kernelPackages = pkgs.linuxPackages_zen;

    # FIX: Disable USB autosuspend (Fixes dongle disconnects at boot)
    kernelParams = [ "usbcore.autosuspend=-1" ];

    loader.systemd-boot.enable = true;
    loader.efi.canTouchEfiVariables = true;
    plymouth.enable = true;
  };
}
