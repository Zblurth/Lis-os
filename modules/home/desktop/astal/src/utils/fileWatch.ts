import { GLib } from "astal";

export type FileChangeCallback = (content: string) => void;

export function watchFile(filePath: string, callback: FileChangeCallback): GLib.Source {
  let lastContent = "";
  const decoder = new TextDecoder();

  try {
    const [success, contents] = GLib.file_get_contents(filePath);
    if (success && contents) {
      lastContent = decoder.decode(contents);
      callback(lastContent);
    }
  } catch (e) {
    print(`[FileWatch] Initial read failed for ${filePath}: ${e}`);
  }

  const source = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
    try {
      const [success, contents] = GLib.file_get_contents(filePath);
      if (success && contents) {
        const content = decoder.decode(contents);
        if (content !== lastContent) {
          lastContent = content;
          callback(content);
        }
      }
    } catch (e) {
      // Squelch errors during polling
    }
    return true; // Keep polling
  });
  
  return source;
}
