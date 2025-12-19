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
    pkgs.gowall
    # pkgs.pastel  # REMOVED: Now using native coloraide
    # pkgs.imagemagick  # DISABLED: Only needed for icon tinting (see icons.py)
    pkgs.swww
    pkgs.libnotify
    pkgs.procps
    pkgs.gnused
    pkgs.findutils
    pkgs.gnugrep
    pkgs.gawk
    pkgs.bc
    pkgs.chafa
    resolveIconsScript
    magicianScript
  ];

  # 4. CLI Wrappers
  engineScript = pkgs.writeShellScriptBin "theme-engine" ''
    export PATH=${pkgs.lib.makeBinPath runtimeDeps}:$PATH
    if [ $# -eq 0 ]; then
      exec magician
    else
      exec magician set "$@"
    fi
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

  precacheScript = pkgs.writeShellScriptBin "theme-precache" ''
    export PATH=${pkgs.lib.makeBinPath runtimeDeps}:$PATH
    exec magician precache "$@"
  '';

  # 5. Magician Python Environment
  magicianEnv = pkgs.python3.withPackages (ps: [
    ps.pillow
    ps.jinja2
    ps.watchfiles
    ps.tomli
    ps.pydantic
    ps.coloraide
    ps.blake3 # For wallpaper hash caching
    # Color Science v2 dependencies
    ps.numpy # Array math
    ps.opencv4 # Saliency detection, FFT
    ps.scikit-learn # K-Means clustering
    ps.scipy # Optimization (optional)
    ps.textual # TUI Framework
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
    precacheScript
    ;
}
