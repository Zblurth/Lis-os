import GObject, { register, property } from "astal/gobject"
import { interval, bind } from "astal"
import { execAsync } from "astal/process"
import ConfigAdapter from "../ConfigAdapter"

const FALLBACK_LAT = 48.8566;
const FALLBACK_LON = 2.3522;

@register({ GTypeName: "Weather" })
export default class Weather extends GObject.Object {
    static instance: Weather
    static get_default() {
        if (!this.instance) this.instance = new Weather()
        return this.instance
    }

    @property(Number) get temperature() { return this.#temperature }
    @property(String) get icon() { return this.#icon }
    @property(String) get description() { return this.#description }

    #temperature = 0
    #icon = "weather-severe-alert-symbolic"
    #description = "Unknown"
    #lat = 0
    #lon = 0

    constructor() {
        super()
        this.init()
        interval(1800000, () => this.fetchWeather())
    }

    async init() {
        const configAdapter = ConfigAdapter.get();
        // We can't easily sync wait for config here, so we default to auto, 
        // but you can hot-reload weather by editing the config file which triggers a service restart or logic update if we watched it.
        // For simplicity in this script, we check if a city is set in the file.

        try {
            // 1. Try Config City Name
            const cfg = configAdapter.value;
            const city = (cfg as any)?.widgets?.weather?.city;

            if (city) {
                const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
                const geoRes = await execAsync(`curl -s "${geoUrl}"`);
                const geoJson = JSON.parse(geoRes);
                if (geoJson.results && geoJson.results.length > 0) {
                    this.#lat = geoJson.results[0].latitude;
                    this.#lon = geoJson.results[0].longitude;
                    print(`[Weather] Configured City: ${city} (${this.#lat}, ${this.#lon})`);
                    this.fetchWeather();
                    return;
                }
            }

            // 2. Auto-locate
            const locRes = await execAsync("curl -s http://ip-api.com/json/");
            const locJson = JSON.parse(locRes);
            if (locJson.lat && locJson.lon) {
                this.#lat = locJson.lat;
                this.#lon = locJson.lon;
            } else {
                throw new Error("IP Geolocation failed");
            }
        } catch (e) {
            print(`[Weather] Location fallback used.`);
            this.#lat = FALLBACK_LAT;
            this.#lon = FALLBACK_LON;
        }
        this.fetchWeather();
    }

    async fetchWeather() {
        if (this.#lat === 0) return
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.#lat}&longitude=${this.#lon}&current_weather=true`;
            const res = await execAsync(`curl -s "${url}"`);
            const json = JSON.parse(res);
            if (json.current_weather) {
                this.#temperature = json.current_weather.temperature;
                const code = json.current_weather.weathercode;
                this.#icon = this.getIcon(code);
                this.#description = this.getDescription(code);

                this.notify("temperature");
                this.notify("icon");
                this.notify("description");
            }
        } catch (e) {
            console.error("[Weather] Failed to fetch:", e);
        }
    }

    getIcon(code: number) {
        if (code === 0) return "weather-clear-symbolic"
        if (code <= 3) return "weather-few-clouds-symbolic"
        if (code <= 48) return "weather-fog-symbolic"
        if (code <= 67) return "weather-showers-symbolic"
        if (code <= 77) return "weather-snow-symbolic"
        if (code <= 82) return "weather-showers-symbolic"
        if (code <= 99) return "weather-storm-symbolic"
        return "weather-severe-alert-symbolic"
    }

    getDescription(code: number) {
        if (code === 0) return "Clear sky"
        if (code === 1) return "Mainly clear"
        if (code === 2) return "Partly cloudy"
        if (code === 3) return "Overcast"
        if (code <= 48) return "Fog"
        if (code <= 67) return "Rain"
        if (code <= 77) return "Snow"
        if (code <= 99) return "Thunderstorm"
        return "Unknown"
    }
}
