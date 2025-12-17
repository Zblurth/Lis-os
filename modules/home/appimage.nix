{ pkgs, ... }:

{
  home.packages = [
    # Declarative AppImages removed as per user request
  ];

  xdg.desktopEntries.appimage-runner = {
    name = "AppImage Runner";
    exec = "${pkgs.appimage-run}/bin/appimage-run %f";
    type = "Application";
    mimeType = [ "application/vnd.appimage" ];
    noDisplay = true;
  };

  xdg.mimeApps.defaultApplications = {
    "application/vnd.appimage" = [ "appimage-runner.desktop" ];
  };
}
