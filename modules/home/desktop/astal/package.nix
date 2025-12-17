{
  pkgs,
  astalPkgs,
  ags,
  ...
}:
let
  inherit (astalPkgs)
    astal3
    io
    battery
    network
    tray
    wireplumber
    notifd
    apps
    mpris
    hyprland
    bluetooth
    ;

  astal-gjs = pkgs.symlinkJoin {
    name = "astal-gjs";
    paths = [
      astal3
      io
      battery
      network
      tray
      wireplumber
      notifd
      apps
      mpris
      hyprland
      bluetooth
    ];
  };
in
pkgs.stdenv.mkDerivation rec {
  pname = "lis-bar";
  version = "0.1.0";
  src = ./.;

  nativeBuildInputs = [
    pkgs.wrapGAppsHook3
    pkgs.gobject-introspection
    ags
  ];

  buildInputs = [
    pkgs.gjs
    astal3
    io
    battery
    network
    tray
    wireplumber
    notifd
    apps
    mpris
    hyprland
    bluetooth
    pkgs.glib
    pkgs.gtk3
    pkgs.gsettings-desktop-schemas
  ];

  buildPhase = ''
    # Create package.json
    cat <<JSON > package.json
    {
      "name": "lis-bar",
      "dependencies": {
        "astal": "${astal-gjs}/share/astal/gjs"
      }
    }
    JSON

    # --- INJECT CAVA PATH ---
    sed -i "s|@CAVA_PATH@|${pkgs.cava}/bin/cava|g" src/services/cava.ts

    # --- BUNDLE & COPY ASSETS ---
    mkdir -p $out/share/lis-bar
    ags bundle app.tsx $out/share/lis-bar/main.js

    # Copy the entire style directory so relative imports in main.css work
    cp -r style $out/share/lis-bar/style

    # Copy default.toml (The Truth)
    cp default.toml $out/share/lis-bar/default.toml
  '';

  installPhase = ''
        mkdir -p $out/bin
        cat <<SCRIPT > $out/bin/${pname}
    #!/bin/sh
    set -e
    export GJS_DEBUG_TOPICS="JS ERROR;JS LOG"
    export PATH="${
      pkgs.lib.makeBinPath [
        pkgs.curl
        pkgs.brightnessctl
        pkgs.wl-clipboard
        pkgs.cliphist
      ]
    }:\$PATH"
    exec ${pkgs.gjs}/bin/gjs -m $out/share/lis-bar/main.js "\$@"
    SCRIPT
        chmod +x $out/bin/${pname}
  '';
}
