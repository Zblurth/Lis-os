import { bind } from "astal";
import iconManifest from "../services/IconService";

interface ThemedIconProps {
  appId: string;
  className?: string;
  css?: string;
  palette?: "primary" | "accent";
  size?: number | import("astal").Binding<number>;
}

export default function ThemedIcon({
  appId,
  className = "",
  css = "",
  palette = "primary",
  size,
}: ThemedIconProps) {

  const iconPath = bind(iconManifest).as(manifest => {
    const FALLBACK = "image-missing";

    if (!manifest || !appId) return FALLBACK;

    // Strict lookup. The backend is the source of truth.
    const path = manifest[palette]?.[appId];

    if (!path) {
      // Uncomment this to see exactly why it fails in the logs
      // print(`[ThemedIcon] Lookup failed for '${appId}' in palette '${palette}'`);
      // print(`[ThemedIcon] Manifest keys example: ${Object.keys(manifest[palette]).slice(0, 5).join(", ")}`);
      return FALLBACK;
    }

    return path;
  });

  const finalClassName = `ThemedIcon ${className}`;

  // If size is provided, we use pixelSize for semantic clarity
  // If it's a Binding, Astal handles it.
  return (
    <icon
      icon={iconPath}
      className={finalClassName}
      css={css}
      pixelSize={size}
    />
  );
}
