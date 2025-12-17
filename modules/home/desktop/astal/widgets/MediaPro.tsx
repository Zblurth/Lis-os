/**
 * MediaPro.tsx
 * 
 * V5 Compliant Media Widget
 * - Uses MediaService for priority player selection
 * - Single instance (no create/destroy cycles)
 * - Memory-safe with onDestroy cleanup
 */

import { bind } from "astal";
import { Gtk } from "astal/gtk3";
import MediaService from "../src/services/MediaService";
import SafeWidget from "../src/components/SafeWidget";
import ConfigAdapter from "../src/ConfigAdapter";

export default function MediaPro() {
    const media = MediaService.get_default();
    const config = bind(ConfigAdapter.get().adapter);

    // Reactive Limits
    const titleLimit = config.as(c => c.limits?.mediaTitle ?? 25);
    const artistLimit = config.as(c => c.limits?.mediaArtist ?? 15);

    // Geometry math (Math-in-TS) - Reactive
    const artSize = config.as(c => Math.floor(c.layout.barHeight * 0.9));

    // Reactive bindings
    const hasPlayer = bind(media.activePlayer).as(p => p !== null);
    const title = bind(media.title).as(t => String(t || "Unknown"));
    const artist = bind(media.artist).as(a => String(a || "Unknown"));
    const coverArt = bind(media.coverArt);
    const isPlaying = bind(media.isPlaying);

    return (
        <box
            className="MediaProPill"
            visible={hasPlayer}
            valign={Gtk.Align.FILL}
        >
            <eventbox
                onClick={() => media.togglePlayPause()}
            >
                <box className="MediaProContent" valign={Gtk.Align.CENTER} spacing={8}>
                    {/* Album Art Circle with Progress Ring */}
                    <overlay>
                        <box
                            className="ArtCircle"
                            widthRequest={artSize}
                            heightRequest={artSize}
                            halign={Gtk.Align.CENTER}
                            valign={Gtk.Align.CENTER}
                            css={coverArt.as(art => art
                                ? `background-image: url('${art}');`
                                : ""
                            )}
                        >
                            {/* Fallback icon when no art */}
                            <icon
                                icon={isPlaying.as(p => p ? "media-playback-pause-symbolic" : "media-playback-start-symbolic")}
                                visible={coverArt.as(art => !art)}
                            />
                        </box>

                        <drawingarea
                            widthRequest={artSize}
                            heightRequest={artSize}
                            halign={Gtk.Align.CENTER}
                            valign={Gtk.Align.CENTER}
                            setup={(self) => {
                                // Redraw when position or length changes
                                self.hook(media.position, () => self.queue_draw());
                                self.hook(media.length, () => self.queue_draw());
                                // Redraw when config (colors) changes
                                self.hook(config, () => self.queue_draw());
                            }}
                            onDraw={(self, cr) => {
                                const currentConfig = ConfigAdapter.get().value;
                                const size = Math.floor(currentConfig.layout.barHeight * 0.9);
                                const w = size;
                                const h = size;
                                const center_x = w / 2;
                                const center_y = h / 2;
                                const lineWidth = 2;
                                const radius = (Math.min(w, h) / 2) - (lineWidth / 2);

                                const len = media.length.get();
                                const pos = media.position.get();
                                const percent = len > 0 ? pos / len : 0;

                                // Parse accent color from config
                                const accentHex = currentConfig.appearance.colors.accent;
                                const r = parseInt(accentHex.slice(1, 3), 16) / 255;
                                const g = parseInt(accentHex.slice(3, 5), 16) / 255;
                                const b = parseInt(accentHex.slice(5, 7), 16) / 255;

                                // Draw Background Ring (faint, under active)
                                cr.setSourceRGBA(1, 1, 1, 0.1);
                                cr.setLineWidth(lineWidth);
                                cr.arc(center_x, center_y, radius, 0, 2 * Math.PI);
                                cr.stroke();

                                // Draw Progress Arc
                                if (percent > 0) {
                                    cr.setSourceRGBA(r, g, b, 1);
                                    cr.setLineWidth(lineWidth);
                                    // Start from top (-90 deg or -PI/2)
                                    const startAngle = -Math.PI / 2;
                                    const endAngle = startAngle + (percent * 2 * Math.PI);
                                    cr.arc(center_x, center_y, radius, startAngle, endAngle);
                                    cr.stroke();
                                }
                            }}
                        />
                    </overlay>

                    {/* Track Info */}
                    <box className="TrackInfo" valign={Gtk.Align.CENTER}>
                        <label
                            className="TrackTitle"
                            label={title}
                            truncate
                            maxWidthChars={titleLimit}
                        />
                        <label label=" - " css="color: alpha(@text, 0.5);" />
                        <label
                            className="TrackArtist"
                            label={artist}
                            truncate
                            maxWidthChars={artistLimit}
                        />
                    </box>
                </box>
            </eventbox>
        </box>
    );
}
