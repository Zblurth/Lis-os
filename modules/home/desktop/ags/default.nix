{
  inputs,
  pkgs,
  config,
  lib,
  ...
}:
let
  system = pkgs.system;
  astal = inputs.astal.packages.${system};
  ags-pkg = inputs.ags.packages.${system}.default; # Contains the JS bindings

  configPath = "${config.home.homeDirectory}/Lis-os/modules/home/desktop/ags/config";

  # 1. UNIFIED NATIVE ENV (C Libraries)
  astal-native-env = pkgs.symlinkJoin {
    name = "astal-native-env";
    paths = [
      astal.astal3
      astal.default # Core logic
      astal.io
      astal.battery
      astal.wireplumber
      astal.network
      astal.tray
      astal.notifd
      astal.apps
    ];
  };

  # 2. THE RUNNER
  ags-run-script = pkgs.writeShellScriptBin "ags" ''
    pkill -f "gjs" || true

    echo "📦 Bundling..."
    ${pkgs.esbuild}/bin/esbuild "${configPath}/app.ts" \
      --bundle \
      --outfile="/tmp/astal-dev.js" \
      --format=esm \
      --loader:.css=text \
      --jsx-factory=Astal.Gtk.Gtk \
      --jsx-fragment=Astal.Gtk.Fragment \
      --external:astal \
      --external:astal/* \
      --external:gi://* \
      --external:file://*

    if [ $? -ne 0 ]; then exit 1; fi

    echo "🚀 Running..."

    # PATHS
    # We point to the JS files inside the AGS package in the store.
    # We check multiple common paths to be safe.
    export GJS_PATH="${ags-pkg}/share/astal/gjs:${ags-pkg}/share/ags/js:${ags-pkg}/share/com.github.Aylur.ags/js:$GJS_PATH"

    # The native libraries
    export GI_TYPELIB_PATH="${pkgs.gtk3}/lib/girepository-1.0:${astal-native-env}/lib/girepository-1.0:$HOME/.nix-profile/lib/girepository-1.0:$GI_TYPELIB_PATH"

    ${pkgs.gjs}/bin/gjs -m /tmp/astal-dev.js &
  '';
in
{
  home.packages = [
    ags-run-script # Provides 'ags' command
    pkgs.esbuild
    pkgs.gjs
    pkgs.socat

    # Libraries
    astal-native-env
    # ags-pkg  <-- REMOVED: It causes a binary conflict. The script above still uses it by path.

    pkgs.dart-sass
    pkgs.fd
    pkgs.bluez
    pkgs.libadwaita
    pkgs.gtk3
  ];

  xdg.configFile."ags".source = config.lib.file.mkOutOfStoreSymlink configPath;
}
