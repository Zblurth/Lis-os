{ pkgs, config, ... }:

{
  # --- Graphics ---
  hardware.graphics = {
    enable = true;
    enable32Bit = true;
  };

  services.xserver.videoDrivers = [ "amdgpu" ];

  # AMD ROCm / HIP support
  systemd.tmpfiles.rules = [
    "L+    /opt/rocm/hip   -    -    -     -    ${pkgs.rocmPackages.clr}"
  ];

  # --- Sensors & Kernel Modules ---
  boot.kernelModules = [
    "it87"
    "v4l2loopback"
  ];
  boot.extraModulePackages = [
    config.boot.kernelPackages.v4l2loopback
    config.boot.kernelPackages.it87
  ];

  # --- Overclocking & Control ---
  programs.coolercontrol.enable = true;
  programs.corectrl.enable = true;

  # UPDATED: New location for overdrive settings
  hardware.amdgpu.overdrive = {
    enable = true;
    ppfeaturemask = "0xffffffff";
  };
}
