{ pkgs, config, ... }:
{
  hardware = {
    sane = {
      enable = true;
      extraBackends = [ pkgs.sane-airscan ];
      disabledDefaultBackends = [ "escl" ];
    };

    graphics = {
      enable = true;
      package = pkgs.mesa_git.drivers;
      package32 = pkgs.mesa32_git.drivers;
    };
    enableRedistributableFirmware = true;

    bluetooth = {
      enable = true;
      powerOnBoot = true;
      settings = {
        General = {
          AutoEnable = true;
          Experimental = true; # Better codec support for Galaxy Buds
        };
      };
    };

    i2c.enable = true;
  };

  # GPU/CPU overclocking utility
  programs.corectrl.enable = true;

  # InputPlumber - Makes Flydigi Vader 4 Pro appear as Steam Deck Controller
  # Enables full paddle/C/Z button support via Steam Input
  services.inputplumber.enable = false;

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
  # Rule 4: Unblock Bluetooth via rfkill when hci device appears
  services.udev.extraRules = ''
    KERNEL=="i2c-[0-9]*", GROUP="i2c", MODE="0660"
    SUBSYSTEM=="i2c", ACTION=="add", ATTR{name}=="AMDGPU DM*", RUN+="${pkgs.bash}/bin/sh -c 'echo ddcci 0x37 > /sys/bus/i2c/devices/%k/new_device'"

    # VXE Dragonfly R1 Series Wireless Mouse (Compx Nearlink)
    # Product 10c9 = Wireless dongle mode, Product 10c7 = Wired/Cable mode
    # Grants hidraw access to 'users' group for WebHID browser configuration
    SUBSYSTEM=="hidraw", ATTRS{idVendor}=="373b", ATTRS{idProduct}=="10c9", MODE="0660", GROUP="users", TAG+="uaccess"
    SUBSYSTEM=="hidraw", ATTRS{idVendor}=="373b", ATTRS{idProduct}=="10c7", MODE="0660", GROUP="users", TAG+="uaccess"
    # Also grant USB device access for WebUSB fallback
    SUBSYSTEM=="usb", ATTR{idVendor}=="373b", ATTR{idProduct}=="10c9", MODE="0660", GROUP="users", TAG+="uaccess"
    SUBSYSTEM=="usb", ATTR{idVendor}=="373b", ATTR{idProduct}=="10c7", MODE="0660", GROUP="users", TAG+="uaccess"
    # Disable the fake keyboard interfaces by unbinding from usbhid driver
    # This is more aggressive than LIBINPUT_IGNORE - it prevents the HID devices from being created at all
    # Wireless dongle (10c9) - interfaces 0 and 1 are fake keyboards, interface 2 is the mouse
    SUBSYSTEM=="usb", DRIVER=="usbhid", ATTRS{idVendor}=="373b", ATTRS{idProduct}=="10c9", ATTR{bInterfaceNumber}=="00", RUN+="${pkgs.bash}/bin/sh -c 'echo $kernel > /sys/bus/usb/drivers/usbhid/unbind'"
    SUBSYSTEM=="usb", DRIVER=="usbhid", ATTRS{idVendor}=="373b", ATTRS{idProduct}=="10c9", ATTR{bInterfaceNumber}=="01", RUN+="${pkgs.bash}/bin/sh -c 'echo $kernel > /sys/bus/usb/drivers/usbhid/unbind'"
    # Wired/Cable mode (10c7) - same treatment
    SUBSYSTEM=="usb", DRIVER=="usbhid", ATTRS{idVendor}=="373b", ATTRS{idProduct}=="10c7", ATTR{bInterfaceNumber}=="00", RUN+="${pkgs.bash}/bin/sh -c 'echo $kernel > /sys/bus/usb/drivers/usbhid/unbind'"
    SUBSYSTEM=="usb", DRIVER=="usbhid", ATTRS{idVendor}=="373b", ATTRS{idProduct}=="10c7", ATTR{bInterfaceNumber}=="01", RUN+="${pkgs.bash}/bin/sh -c 'echo $kernel > /sys/bus/usb/drivers/usbhid/unbind'"

    # Unblock Bluetooth when the HCI device appears (fixes rfkill soft-block at boot)
    SUBSYSTEM=="bluetooth", KERNEL=="hci*", ACTION=="add", RUN+="${pkgs.util-linux}/bin/rfkill unblock bluetooth"
  '';

  # Disable ASPM for MediaTek mt7925e WiFi/BT card to fix PM resume errors
  boot.kernelParams = [ "pcie_aspm=off" ];
}
