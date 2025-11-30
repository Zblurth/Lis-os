{ pkgs, username, ... }:
{
  programs.nh = {
    enable = true;
    clean = {
      enable = true;
      extraArgs = "--keep-since 7d --keep 5";
    };
    flake = "/home/${username}/Lis-os";
  };

  # FORCE the variable
  environment.variables.FLAKE = "/home/${username}/Lis-os";

  environment.systemPackages = with pkgs; [
    nix-output-monitor
    nvd
  ];
}
