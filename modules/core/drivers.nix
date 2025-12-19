{ pkgs, config, ... }:
{
  hardware.graphics = {
    enable = true;
    enable32Bit = true;
  };

  services.xserver.videoDrivers = [ "amdgpu" ];
  systemd.tmpfiles.rules = [
    "L+    /opt/rocm/hip   -    -    -     -    ${pkgs.rocmPackages.clr}"
  ];
  boot.kernelModules = [
    "it87"
    "v4l2loopback"
  ];
  boot.extraModulePackages = [
    config.boot.kernelPackages.v4l2loopback
    config.boot.kernelPackages.it87
  ];
  programs.coolercontrol.enable = true;
  hardware.amdgpu.overdrive = {
    enable = true;
    ppfeaturemask = "0xffffffff";
  };
}
