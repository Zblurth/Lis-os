{ pkgs, ... }:
{
  hardware = {
    # Scanning support
    sane = {
      enable = true;
      extraBackends = [ pkgs.sane-airscan ];
      disabledDefaultBackends = [ "escl" ];
    };

    # GPU
    graphics.enable = true;
    enableRedistributableFirmware = true;

    # Bluetooth
    bluetooth.enable = true;
    bluetooth.powerOnBoot = true;
  };

  # Removed Corsair Udev rules and Logitech wireless settings
}
