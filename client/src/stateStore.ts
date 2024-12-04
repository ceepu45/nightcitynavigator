import { create } from 'zustand'
import { type Map } from "maplibre-gl";

type State = {
    navigating: boolean
    recording: boolean
    tracking: boolean
    map: Map | null
}

type Action = {
    setNavigating: (navigating: boolean) => void
    setRecording: (recording: boolean) => void
    setTracking: (tracking: boolean) => void
    setMap: (map: Map) => void
    zoomIn: () => void
    zoomOut: () => void
}

export default create<State & Action>((set, get) => ({
    navigating: false,
    recording: false,
    tracking: false,
    map: null,

    setNavigating: navigating => set(() => ({ navigating })),
    setRecording: recording => set(() => ({ recording })),
    setTracking: tracking => set(() => ({ tracking })),

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
}));

