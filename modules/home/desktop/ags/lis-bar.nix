# File: modules/home/desktop/ags/lis-bar.nix
{
  stdenv,
  bun,
  nodePackages,
  fetchFromGitHub,
  makeWrapper,
  gtk3,
  astal,
}:

let
  configSource = ./config;

  # Get AGS v2 source - use the revision from your updated lock
  ags-rev = "e169694390548dfd38ff40f1ef2163d6c3ffe3ea"; # Update this!
  ags-src = fetchFromGitHub {
    owner = "aylur";
    repo = "ags";
    rev = ags-rev;
    sha256 = "1rxxzw3xa0kfqy48x7i1vzilz4ivchagqx930z3r64wqb20aakva"; # Update this!
  };
in

stdenv.mkDerivation {
  pname = "lis-bar";
  version = "0.1.0";

  src = configSource;

  nativeBuildInputs = [
    bun
    nodePackages.nodejs
    makeWrapper
  ];

  buildPhase = ''
        mkdir -p $out/share/lis-bar

        # 1. Copy your config
        cp -r ${configSource}/* $out/share/lis-bar/

        # 2. Copy AGS v2 source as a dependency
        mkdir -p $out/share/lis-bar/node_modules/ags
        cp -r ${ags-src}/* $out/share/lis-bar/node_modules/ags/

        # 3. Create a minimal package.json
        cat > $out/share/lis-bar/package.json <<EOF
    {
      "name": "lis-bar",
      "type": "module",
      "dependencies": {
        "ags": "file:./node_modules/ags"
      },
      "scripts": {
        "start": "ags run . --gtk 3"
      }
    }
    EOF

        # 4. Install dependencies with bun
        cd $out/share/lis-bar
        bun install --production --no-save
  '';

  installPhase = ''
    mkdir -p $out/bin

    # Create wrapper that runs bun with your app
    makeWrapper ${bun}/bin/bun $out/bin/lis-bar \
      --add-flags "run" \
      --add-flags "start" \
      --chdir "$out/share/lis-bar" \
      --set GI_TYPELIB_PATH "${gtk3}/lib/girepository-1.0:${astal.astal3}/lib/girepository-1.0:${astal.default}/lib/girepository-1.0:${astal.io}/lib/girepository-1.0:${astal.battery}/lib/girepository-1.0:${astal.wireplumber}/lib/girepository-1.0:${astal.network}/lib/girepository-1.0:${astal.tray}/lib/girepository-1.0:${astal.notifd}/lib/girepository-1.0:${astal.apps}/lib/girepository-1.0" \
      --set NODE_ENV "production" \
      --argv0 "lis-bar"
  '';
}
