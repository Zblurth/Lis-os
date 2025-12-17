import { GLib, GObject } from "astal";
import { register } from "astal/gobject";
import Notifd from "gi://AstalNotifd?version=0.1";

@register({ GTypeName: "NotificationService" })
export default class NotificationService extends GObject.Object {
    static instance: NotificationService;
    static get_default() {
        if (!this.instance) this.instance = new NotificationService();
        return this.instance;
    }

    #notifd: Notifd.Notifd;
    #recentNotifications: Map<string, number> = new Map(); // hash -> timestamp
    #dedupWindow = 1000; // ms

    constructor() {
        super();
        this.#notifd = Notifd.get_default();

        // Subscribe to the notified signal
        // We use connect directly on the GObject proxy
        this.#notifd.connect("notified", (_, id) => {
            this.handleNotification(id);
        });
    }

    private handleNotification(id: number) {
        const notification = this.#notifd.get_notification(id);
        if (!notification) return;

        // Calculate hash: appName + summary + body
        const content = `${notification.appName}${notification.summary}${notification.body}`;
        const checksum = new GLib.Checksum(GLib.ChecksumType.SHA256);
        checksum.update(content);
        const hash = checksum.get_string();
        const now = Date.now();

        // Check for duplicate
        if (this.#recentNotifications.has(hash)) {
            const lastTime = this.#recentNotifications.get(hash)!;
            if (now - lastTime < this.#dedupWindow) {
                print(`[NotificationService] Spam detected! Dismissing: ${notification.summary}`);
                notification.dismiss();
                return;
            }
        }

        // Update map
        this.#recentNotifications.set(hash, now);

        // Cleanup old entries (simple GC)
        if (this.#recentNotifications.size > 50) {
            for (const [k, t] of this.#recentNotifications) {
                if (now - t > this.#dedupWindow) this.#recentNotifications.delete(k);
            }
        }
    }
}
