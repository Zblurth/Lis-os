import configparser
import os
import sys

import gi

# Enable Debugging
# sys.stderr = open(os.devnull, 'w')

try:
    gi.require_version("Gtk", "3.0")
    from gi.repository import GLib, Gtk
except Exception as e:
    print(f"GTK Import Error: {e}", file=sys.stderr)
    sys.exit(1)

# Aliases to force specific icons if the main one is missing/generic
ALIASES = {
    "thunar": ["system-file-manager", "file-manager", "folder"],
    "nautilus": ["system-file-manager", "file-manager"],
    "dolphin": ["system-file-manager", "file-manager"],
    "code": ["vscode", "visual-studio-code", "com.visualstudio.code"],
    "spotify": ["spotify-client"],
    "zed": ["dev.zed.Zed"],
}


def get_current_theme():
    try:
        config_path = os.path.expanduser("~/.config/gtk-3.0/settings.ini")
        if os.path.exists(config_path):
            config = configparser.ConfigParser()
            config.read(config_path)
            if "Settings" in config and "gtk-icon-theme-name" in config["Settings"]:
                return config["Settings"]["gtk-icon-theme-name"]
    except:
        pass
    return "Adwaita"


def get_data_dirs():
    dirs = list(GLib.get_system_data_dirs())
    dirs.append(GLib.get_user_data_dir())
    home = os.path.expanduser("~")
    user = os.environ.get("USER", "lune")
    dirs.append(f"/etc/profiles/per-user/{user}/share")
    dirs.append(os.path.join(home, ".nix-profile", "share"))
    dirs.append(os.path.join(home, ".local", "share"))
    return dirs


def manual_search(theme_name, icon_name):
    """Brute force search in specific theme."""
    if not icon_name or not theme_name:
        return None

    for d in get_data_dirs():
        theme_dir = os.path.join(d, "icons", theme_name)
        if not os.path.isdir(theme_dir):
            continue

        # Check standard subdirs
        subdirs = [
            "scalable/apps",
            "48x48/apps",
            "32x32/apps",
            "128x128/apps",
            "scalable/places",
            "48x48/places",
        ]

        for sub in subdirs:
            # Try SVG
            target = os.path.join(theme_dir, sub, f"{icon_name}.svg")
            if os.path.exists(target):
                return target
            # Try PNG
            target_png = os.path.join(theme_dir, sub, f"{icon_name}.png")
            if os.path.exists(target_png):
                return target_png

    return None


def scan_desktop_files():
    apps = {}
    for data_dir in get_data_dirs():
        app_dir = os.path.join(data_dir, "applications")
        if not os.path.isdir(app_dir):
            continue
        try:
            for filename in os.listdir(app_dir):
                if not filename.endswith(".desktop"):
                    continue
                filepath = os.path.join(app_dir, filename)
                icon_name = None
                try:
                    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                        for line in f:
                            if line.strip().startswith("Icon="):
                                icon_name = line.strip().split("=", 1)[1]
                                break
                except:
                    continue
                if icon_name:
                    clean_id = filename.replace(".desktop", "")
                    apps[clean_id] = icon_name
        except OSError:
            continue
    return apps


def lookup_path(theme, icon_name, theme_name_str):
    if not icon_name:
        return None
    if icon_name.startswith("/"):
        return icon_name if os.path.exists(icon_name) else None

    # 1. Try GTK Standard Lookup (Might return hicolor)
    gtk_path = None
    try:
        icon_info = theme.lookup_icon(icon_name, 48, Gtk.IconLookupFlags.USE_BUILTIN)
        if icon_info:
            f = icon_info.get_filename()
            if f and not f.startswith("/org/") and os.path.exists(f):
                gtk_path = f
    except:
        pass

    # 2. Try Brute Force in User Theme (Prefer this!)
    manual = manual_search(theme_name_str, icon_name)
    if manual:
        return manual

    # 3. Try Brute Force in Hicolor (Fallback for Zed etc)
    if not gtk_path:
        manual_fallback = manual_search("hicolor", icon_name)
        if manual_fallback:
            return manual_fallback

    return gtk_path


def resolve_icons():
    theme = Gtk.IconTheme.new()
    user_theme = get_current_theme()
    print(f"DEBUG: Active Theme: {user_theme}", file=sys.stderr)
    theme.set_custom_theme(user_theme)

    for d in get_data_dirs():
        theme.append_search_path(os.path.join(d, "icons"))
        theme.append_search_path(os.path.join(d, "pixmaps"))

    apps = scan_desktop_files()

    for app_id, icon_input in apps.items():
        # Step A: Get the "Best Effort" path for the requested icon name
        # This might be Tela (Good) or Hicolor (Bad for Thunar, Good for Zed)
        initial_path = lookup_path(theme, icon_input, user_theme)

        # Helper: Is this path "Themed" (Tela)?
        def is_themed(p):
            return p and user_theme in p

        final_path = initial_path

        # Step B: If the result is NOT themed (it's hicolor/system), try aliases to find a themed one
        if not is_themed(initial_path):
            candidates = []
            if app_id in ALIASES:
                candidates.extend(ALIASES[app_id])
            if "." in icon_input:
                candidates.append(icon_input.split(".")[-1])
            if "-" in icon_input:
                candidates.append(icon_input.split("-")[0])
            candidates.append(icon_input.lower())

            for cand in candidates:
                better = lookup_path(theme, cand, user_theme)

                # If we found a THEMED version via alias, take it immediately!
                if is_themed(better):
                    final_path = better
                    break

        # Output result (If final_path is None, we truly found nothing)
        if final_path:
            print(f"{app_id}|{final_path}")
            if "zed" in app_id or "thunar" in app_id:
                print(f"DEBUG: {app_id} -> {final_path}", file=sys.stderr)


if __name__ == "__main__":
    resolve_icons()
