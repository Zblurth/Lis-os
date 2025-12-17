# modules/core/greetd.nix
{ pkgs, ... }:
{
  services.greetd = {
    enable = true;
    settings = {
      default_session = {
        # REVERT TO THIS (Simple & Working):
        command = "${pkgs.tuigreet}/bin/tuigreet --time --remember --cmd niri-session";
        user = "greeter";
      };
    };
  };

  # Keep this. It handles unlocking, even if the daemon startup is tricky.
  security.pam.services.greetd.enableGnomeKeyring = true;

  environment.systemPackages = [ pkgs.tuigreet ];
}
