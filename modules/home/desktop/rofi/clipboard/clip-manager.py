import os
import shutil
import subprocess
import sys
import textwrap
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

# Configuration
CACHE_DIR = Path.home() / ".cache" / "rofi-clip-thumbs"
MAX_ITEMS = 50
ICON_SIZE = 256
TEXT_ICON_PATH = CACHE_DIR / "text_icon.png"


def setup():
    if not CACHE_DIR.exists():
        CACHE_DIR.mkdir(parents=True)


def clean_cache(valid_ids):
    for file in CACHE_DIR.glob("*.png"):
        if file.name == "text_icon.png":
            continue
        if file.name == "clear_icon.png":
            continue
        if file.stem not in valid_ids:
            file.unlink()


def wipe_history():
    subprocess.run("cliphist wipe", shell=True)
    if CACHE_DIR.exists():
        shutil.rmtree(CACHE_DIR)
    setup()
    subprocess.run(["notify-send", "Clipboard Cleared", "History and Cache wiped."])


def create_text_thumbnail(text, thumb_path):
    """Draws large text onto a card-like image."""
    # Lighter background for text cards (Dark Grey vs Pitch Black)
    img = Image.new("RGB", (ICON_SIZE, ICON_SIZE), color="#313244")
    d = ImageDraw.Draw(img)

    # Load Font
    font_path = os.environ.get("CLIP_FONT")
    try:
        if font_path and os.path.exists(font_path):
            font = ImageFont.truetype(font_path, 42)  # MASSIVE FONT
        else:
            font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()

    # Wrap text aggressively (12 chars per line for size 42 font)
    wrapped = textwrap.fill(text, width=12)

    # Draw text centered
    d.multiline_text((15, 15), wrapped, font=font, fill="#cdd6f4", spacing=10)

    # Add a visual "Card Border" effect inside the image
    d.rectangle([0, 0, ICON_SIZE - 1, ICON_SIZE - 1], outline="#585b70", width=4)

    img.save(thumb_path, "PNG")


def get_thumbnail(clip_id, is_image, preview_text):
    thumb_path = CACHE_DIR / f"{clip_id}.png"

    if thumb_path.exists():
        return str(thumb_path)

    if is_image:
        try:
            result = subprocess.run(
                ["cliphist", "decode", str(clip_id)], capture_output=True
            )
            if result.returncode != 0:
                return str(TEXT_ICON_PATH)

            img = Image.open(BytesIO(result.stdout))
            img.thumbnail((ICON_SIZE, ICON_SIZE))
            # Pad images to be square so they align with text cards?
            # No, let's keep them natural aspect, Rofi centers them.
            img.save(thumb_path, "PNG")
        except Exception:
            return str(TEXT_ICON_PATH)
    else:
        create_text_thumbnail(preview_text, thumb_path)

    return str(thumb_path)


def main():
    setup()

    if len(sys.argv) > 1:
        arg = sys.argv[1]

        # --- DEBUG MODE ---
        if arg == "debug":
            # Just test text generation
            test_path = Path("debug_text.png")
            create_text_thumbnail(
                "This is a test of the clipboard text system.", test_path
            )
            print(f"Generated text debug at {test_path.absolute()}")
            return

        if arg.isdigit():
            subprocess.run(f"cliphist decode {arg} | wl-copy", shell=True)
            return
        if arg == "clean_request":
            wipe_history()
            return

    # --- LIST MODE ---
    result = subprocess.run(["cliphist", "list"], capture_output=True, text=True)
    lines = result.stdout.strip().split("\n")[:MAX_ITEMS]
    valid_ids = set()

    # Generate Clear Icon
    clear_icon = CACHE_DIR / "clear_icon.png"
    if not clear_icon.exists():
        img = Image.new("RGB", (ICON_SIZE, ICON_SIZE), color="#ff5555")
        d = ImageDraw.Draw(img)
        try:
            f = ImageFont.truetype(os.environ.get("CLIP_FONT", ""), 48)
        except:
            f = None
        d.text((65, 100), "WIPE", font=f, fill="white")
        img.save(clear_icon)

    print(f"Clear History\0icon\x1f{clear_icon}\x1finfo\x1fclean_request")

    for line in lines:
        if not line:
            continue
        parts = line.split("\t", 1)
        if len(parts) < 2:
            continue

        clip_id = parts[0]
        preview = parts[1]
        valid_ids.add(clip_id)

        # Robust Image Detection
        is_image = "binary data" in preview.lower() and "[[" in preview

        if is_image:
            icon = get_thumbnail(clip_id, True, None)
        else:
            clean_text = preview.replace(r"\n", " ").strip()
            icon = get_thumbnail(clip_id, False, clean_text)

        print(f" \0icon\x1f{icon}\x1finfo\x1f{clip_id}")

    clean_cache(valid_ids)


if __name__ == "__main__":
    main()
