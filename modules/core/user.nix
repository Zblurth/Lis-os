{
  pkgs,
  inputs,
  username,
  host,
  profile,
  ...
}:
let
  variables = import ../../hosts/variables.nix;
  inherit (variables) gitUsername;
  defaultShell = variables.defaultShell or "zsh";
  shellPackage = if defaultShell == "fish" then pkgs.fish else pkgs.zsh;
in
{
  imports = [ inputs.home-manager.nixosModules.home-manager ];

  programs.fish.enable = true;
  programs.zsh.enable = true;
  users.groups.i2c = { };

  home-manager = {
    useUserPackages = true;
    useGlobalPkgs = true;
    backupFileExtension = "backup";
    extraSpecialArgs = {
      inherit
        inputs
        username
        host
        profile
        ;
    };
    users.${username} = {
      imports = [ ./../home ];
      home = {
        username = "${username}";
        homeDirectory = "/home/${username}";
        stateVersion = "25.05";
      };
    };
  };
  users.mutableUsers = true;
  users.users.${username} = {
    isNormalUser = true;
    description = "${gitUsername}";
    extraGroups = [
      "adbusers"
      "docker"
      "libvirtd" # For VirtManager
      "lp"
      "networkmanager"
      "scanner"
      "wheel" # sudo access
      "vboxusers" # For VirtualBox
      "i2c"
      "rfkill"
    ];
    # Use configured shell based on defaultShell variable
    shell = shellPackage;
    ignoreShellProgramCheck = true;
  };
  nix.settings.allowed-users = [ "${username}" ];
}
