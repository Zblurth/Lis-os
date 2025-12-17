/**
 * MediaService.ts
 * 
 * V5 Compliant Media Service
 * - Priority-based player selection (streaming > browsers)
 * - Idle timeout with demotion
 * - Memory-safe bindings
 */

import AstalMpris from "gi://AstalMpris";
import { Variable, GLib, bind } from "astal";

// Priority patterns - higher index = lower priority
const PRIORITY_PATTERNS: RegExp[] = [
    /deezer/i,
    /spotify/i,
    /tidal/i,
    /youtube.*music/i,
    /vivaldi|firefox|chrome|chromium/i,
];

const IDLE_TIMEOUT_MS = 30000; // 30 seconds

interface PlayerState {
    player: AstalMpris.Player;
    priority: number;
    idleTimerId: number | null;
    lastPlaying: number; // timestamp
}

class MediaService {
    private static instance: MediaService;
    private mpris: AstalMpris.Mpris;
    private playerStates: Map<string, PlayerState> = new Map();

    // Public reactive state
    readonly activePlayer = Variable<AstalMpris.Player | null>(null);
    readonly isPlaying = Variable<boolean>(false);
    readonly title = Variable<string>("");
    readonly artist = Variable<string>("");
    readonly coverArt = Variable<string>("");
    readonly position = Variable<number>(0);
    readonly length = Variable<number>(0);

    private positionPollId: number | null = null;

    static get_default(): MediaService {
        if (!this.instance) {
            this.instance = new MediaService();
        }
        return this.instance;
    }

    private constructor() {
        this.mpris = AstalMpris.get_default();
        this.init();
    }

    private init() {
        // Subscribe to player list changes
        this.mpris.connect("notify::players", () => {
            this.updatePlayers();
        });

        // Initial update
        this.updatePlayers();

        // Start position polling
        this.startPositionPoll();
    }

    private getScore(player: AstalMpris.Player): number {
        const identity = player.identity?.toLowerCase() || "";
        const busName = player.busName?.toLowerCase() || "";
        const searchStr = `${identity} ${busName}`;

        let baseScore = 0;

        // Base score from priority patterns (higher index = lower priority in array, so we invert)
        // Let's use specific weights:
        // Deezer/Spotify = 100
        // Tidal = 80
        // YT Music = 70
        // Browsers = 10

        if (/deezer|spotify/i.test(searchStr)) baseScore = 100;
        else if (/tidal/i.test(searchStr)) baseScore = 80;
        else if (/youtube.*music/i.test(searchStr)) baseScore = 70;
        else if (/vivaldi|firefox|chrome|chromium/i.test(searchStr)) baseScore = 10;
        else baseScore = 50; // Unknown players get medium priority

        // Bonus for playing status
        if (player.playbackStatus === AstalMpris.PlaybackStatus.PLAYING) {
            baseScore += 100;
        }

        return baseScore;
    }

    private updatePlayers() {
        const players = this.mpris.players;
        const currentIds = new Set<string>();

        // Update or add players
        for (const player of players) {
            const id = player.busName;
            currentIds.add(id);

            if (!this.playerStates.has(id)) {
                // New player
                const state: PlayerState = {
                    player,
                    priority: this.getScore(player),
                    idleTimerId: null,
                    lastPlaying: Date.now(),
                };
                this.playerStates.set(id, state);

                // Watch playback status
                player.connect("notify::playback-status", () => {
                    this.onPlaybackStatusChanged(id);
                });

                // Watch metadata changes
                player.connect("notify::title", () => this.updateActivePlayerData());
                player.connect("notify::artist", () => this.updateActivePlayerData());
                player.connect("notify::cover-art", () => this.updateActivePlayerData());
                player.connect("notify::length", () => this.updateActivePlayerData());
            }
        }

        // Remove stale players
        for (const [id, state] of this.playerStates) {
            if (!currentIds.has(id)) {
                if (state.idleTimerId) {
                    GLib.source_remove(state.idleTimerId);
                }
                this.playerStates.delete(id);
            }
        }

        this.selectBestPlayer();
    }

    private onPlaybackStatusChanged(playerId: string) {
        const state = this.playerStates.get(playerId);
        if (!state) return;

        const isPlaying = state.player.playbackStatus === AstalMpris.PlaybackStatus.PLAYING;

        // Update priority score based on new status
        state.priority = this.getScore(state.player);

        if (isPlaying) {
            // Cancel idle timer
            if (state.idleTimerId) {
                GLib.source_remove(state.idleTimerId);
                state.idleTimerId = null;
            }
            state.lastPlaying = Date.now();
        } else {
            // Start idle timer
            if (!state.idleTimerId) {
                state.idleTimerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, IDLE_TIMEOUT_MS, () => {
                    state.idleTimerId = null;
                    this.selectBestPlayer(); // Re-evaluate after timeout
                    return GLib.SOURCE_REMOVE;
                });
            }
        }

        this.selectBestPlayer();
    }

    private selectBestPlayer() {
        let bestPlayer: AstalMpris.Player | null = null;
        let bestScore = -1;

        for (const [id, state] of this.playerStates) {
            const isPlaying = state.player.playbackStatus === AstalMpris.PlaybackStatus.PLAYING;
            const isIdle = !isPlaying && (Date.now() - state.lastPlaying > IDLE_TIMEOUT_MS);

            // Skip idle players
            if (isIdle) continue;

            // Check dynamic score
            if (state.priority > bestScore) {
                bestScore = state.priority;
                bestPlayer = state.player;
            }
        }

        // Only update if changed (optimization)
        if (this.activePlayer.get() !== bestPlayer) {
            this.activePlayer.set(bestPlayer);
            this.updateActivePlayerData();
        } else {
            // Just update data if same player
            this.updateActivePlayerData();
        }
    }

    private updateActivePlayerData() {
        const player = this.activePlayer.get();

        if (player) {
            this.isPlaying.set(player.playbackStatus === AstalMpris.PlaybackStatus.PLAYING);

            // Debug: Log what we're getting
            console.log(`[MediaService] Player: ${player.identity}, Title: ${player.title}, Artist: ${player.artist}`);

            // Title is a string
            const titleStr = typeof player.title === 'string' ? player.title : String(player.title || "Unknown");
            this.title.set(titleStr || "Unknown");

            // Artist might be array or string
            let artistStr: string;
            if (Array.isArray(player.artist)) {
                artistStr = player.artist.join(", ");
            } else if (typeof player.artist === 'string') {
                artistStr = player.artist;
            } else {
                artistStr = String(player.artist || "Unknown");
            }
            this.artist.set(artistStr || "Unknown");

            this.coverArt.set(player.coverArt || "");
            this.length.set(player.length || 0);
            this.position.set(player.position || 0);
        } else {
            this.isPlaying.set(false);
            this.title.set("");
            this.artist.set("");
            this.coverArt.set("");
            this.length.set(0);
            this.position.set(0);
        }
    }

    private startPositionPoll() {
        this.positionPollId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
            const player = this.activePlayer.get();
            if (player && player.playbackStatus === AstalMpris.PlaybackStatus.PLAYING) {
                this.position.set(player.position || 0);
            }
            return GLib.SOURCE_CONTINUE;
        });
    }

    // Public methods for control
    togglePlayPause() {
        const player = this.activePlayer.get();
        if (player) {
            player.play_pause();
        }
    }

    next() {
        const player = this.activePlayer.get();
        if (player) {
            player.next();
        }
    }

    previous() {
        const player = this.activePlayer.get();
        if (player) {
            player.previous();
        }
    }
}

export default MediaService;
