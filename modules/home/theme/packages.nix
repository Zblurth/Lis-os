{ pkgs, config, ... }:
let
  # 1. Python Environment (For icon resolution)
  pythonEnv = pkgs.python3.withPackages (ps: [
    ps.pygobject3
    ps.pycairo
  ]);

  # 2. Icon Resolver Wrapper
  typelibPath = pkgs.lib.makeSearchPathOutput "lib" "lib/girepository-1.0" [
    pkgs.gtk3
    pkgs.pango
    pkgs.gdk-pixbuf
    pkgs.atk
    pkgs.harfbuzz
    pkgs.gobject-introspection
  ];

  resolveIconsScript = pkgs.writeShellScriptBin "resolve-icons" ''
    export GI_TYPELIB_PATH="${typelibPath}:$GI_TYPELIB_PATH"
    export XDG_DATA_DIRS="$XDG_DATA_DIRS"
    ${pythonEnv}/bin/python3 ${./core/resolve_icons.py}
  '';

  # 3. Engine Runtime Dependencies
  runtimeDeps = [
    pkgs.coreutils
    pkgs.jq
    pkgs.pastel
    pkgs.imagemagick
    pkgs.swww
    pkgs.libnotify
    pkgs.procps
    pkgs.gnused
    pkgs.findutils
    pkgs.gnugrep
    pkgs.gawk
    pkgs.bc
    resolveIconsScript
    magicianScript
  ];

  # 4. CLI Wrappers
  engineScript = pkgs.writeShellScriptBin "theme-engine" ''
    export PATH=${pkgs.lib.makeBinPath runtimeDeps}:$PATH
    exec magician set "$@"
  '';

  daemonScript = pkgs.writeShellScriptBin "lis-daemon" ''
    export PATH=${pkgs.lib.makeBinPath runtimeDeps}:$PATH
    exec magician daemon
  '';

  compareScript = pkgs.writeShellScriptBin "theme-compare" ''
    export PATH=${pkgs.lib.makeBinPath runtimeDeps}:$PATH
    exec magician compare "$@"
  '';

  testScript = pkgs.writeShellScriptBin "theme-test" ''
    export PATH=${pkgs.lib.makeBinPath runtimeDeps}:$PATH
    exec magician test "$@"
  '';

  # 5. Magician Python Environment
  magicianEnv = pkgs.python3.withPackages (ps: [
    ps.pillow
    ps.jinja2
    ps.watchfiles
    ps.tomli
    ps.pydantic
    ps.coloraide
  ]);

  magicianScript = pkgs.writeShellScriptBin "magician" ''
    export PYTHONPATH="${./.}:$PYTHONPATH"
    ${magicianEnv}/bin/python3 ${./core/magician.py} "$@"
  '';

in
{
  inherit
    daemonScript
    magicianScript
    engineScript
    compareScript
    testScript
    ;
}
