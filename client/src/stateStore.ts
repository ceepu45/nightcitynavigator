import { create } from 'zustand'
import { Map, LngLat, Marker } from "maplibre-gl";

const MAX_POSITION_AGE = 10000;

type State = {
    navigating: boolean
    recording: boolean
    tracking: boolean
    map: Map | null
    playerMarker: Marker | null
}

type Action = {
    setNavigating: (navigating: boolean) => void
    setRecording: (recording: boolean) => void
    setTracking: (tracking: boolean) => void
    setMap: (map: Map) => void
    zoomIn: () => void
    zoomOut: () => void
    setPlayerPosition: (data: GpsPoint) => void
    clearPlayerPosition: () => void
}

interface GpsPoint {
    timestamp: string
    lat: number
    lon: number
    alt: number
    heading: number
}

export default create<State & Action>((set, get) => ({
    navigating: false,
    recording: false,
    tracking: false,
    map: null,
    playerMarker: null,

    setNavigating: navigating => set(() => ({ navigating })),
    setRecording: recording => {
        fetch(`/api/logging?on=${recording}`)
            .then(response => response.text())
            .then(log_state => {
                let recording;
                if (log_state === "true") {
                    recording = true;
                } else {
                    recording = false;
                }
                set(() => ({ recording }));
            });
    },

    setTracking: tracking => set((state) => {
        if (state.map && state.playerMarker) {
            state.map.panTo(state.playerMarker.getLngLat());
        }
        return { tracking };
    }),

    // Map Actions
    setMap: map => set(() => ({ map })),
    zoomIn: () => {
        const map = get().map;
        if (map) {
            map.zoomIn();
        }
    },
    zoomOut: () => {
        const map = get().map;
        if (map) {
            map.zoomOut();
        }
    },

    setPlayerPosition: data => {
        const map = get().map;
        if (!map) {
            return;
        }

        let elapsed_ms = Date.now() - Date.parse(data.timestamp);
        if (elapsed_ms > MAX_POSITION_AGE) {
            get().clearPlayerPosition();
        } else {
            const marker = get().playerMarker;

            const point = new LngLat(data.lon, data.lat);

            if (marker) {
                marker.setLngLat(point);
            } else {
                set(() => ({ playerMarker: new Marker().setLngLat(point).addTo(map) }));
            }

            if (get().tracking) {
                map.panTo(point, { animate: true, duration: 0.1 });
            }
        }
    },

    clearPlayerPosition: () => set((state) => {
        if (state.playerMarker) {
            state.playerMarker.remove();
        }

        return { playerMarker: null }
    }),
}));

