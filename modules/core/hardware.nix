{ pkgs, config, ... }:
{
  hardware = {
    sane = {
      enable = true;
      extraBackends = [ pkgs.sane-airscan ];
      disabledDefaultBackends = [ "escl" ];
    };

    graphics.enable = true;
    enableRedistributableFirmware = true;

    bluetooth.enable = true;
    bluetooth.powerOnBoot = true;

    i2c.enable = true;
  };

  # 1. Load the kernel drivers
  boot.extraModulePackages = [ config.boot.kernelPackages.ddcci-driver ];
  boot.kernelModules = [
    "i2c-dev"
    "ddcci_backlight"
  ];

  # 2. Udev Rules (The Magic Part)
  # Rule 1: Give 'i2c' group permissions (Standard)
  # Rule 2: When a new I2C bus appears, check if it's "AMDGPU DM".
  #         If yes, instantly force the ddcci driver to attach.
  # Rule 3: VXE Dragonfly R1 mouse (373b:10c9) - Allow raw HID access for
  #         browser-based configuration via ATK HUB WEB (WebHID/WebUSB)
  services.udev.extraRules = ''
    KERNEL=="i2c-[0-9]*", GROUP="i2c", MODE="0660"
    SUBSYSTEM=="i2c", ACTION=="add", ATTR{name}=="AMDGPU DM*", RUN+="${pkgs.bash}/bin/sh -c 'echo ddcci 0x37 > /sys/bus/i2c/devices/%k/new_device'"

    # VXE Dragonfly R1 Series Wireless Mouse (Compx Nearlink Dongle)
    # Grants hidraw access to 'users' group for WebHID browser configuration
    SUBSYSTEM=="hidraw", ATTRS{idVendor}=="373b", ATTRS{idProduct}=="10c9", MODE="0660", GROUP="users", TAG+="uaccess"
    # Also grant USB device access for WebUSB fallback
    SUBSYSTEM=="usb", ATTR{idVendor}=="373b", ATTR{idProduct}=="10c9", MODE="0660", GROUP="users", TAG+="uaccess"
  '';
}
