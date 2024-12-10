import { create } from 'zustand'
import { Map, LngLat, Marker } from "maplibre-gl";
import { createDirectionsRequest, parsePolylines } from './valhalla';
import { RouteResponse } from './valhallaTypes';

const MAX_POSITION_AGE = 10000;

const NOMINATIM_URL = "https://maps.cpusocket.net/nominatim"
const VALHALLA_URL = "https://maps.cpusocket.net/valhalla"

type State = {
    navigating: boolean
    recording: boolean
    tracking: boolean
    map: Map | null

    playerMarker: Marker
    playerValid: boolean
    destMarker: Marker

    destination: LngLat | null
    dest_search: string
}

type Action = {
    exitNavigation: () => void
    setRecording: (recording: boolean) => void
    setTracking: (tracking: boolean) => void
    setMap: (map: Map) => void
    zoomIn: () => void
    zoomOut: () => void
    setPlayerPosition: (data: GpsPoint) => void
    clearPlayerPosition: () => void

    updateSearchBox: (value: string) => void
    requestGeocodingLookup: (query: string) => void
    requestReverseGeocodingLookup: (location: LngLat) => void
    recieveGeocodingResponse: (data: NominatimPlace[]) => void // TODO interface for nominatim response

    requestDirections: () => void
    recieveDirections: (data: RouteResponse) => void
}

interface GpsPoint {
    timestamp: string
    lat: number
    lon: number
    alt: number
    heading: number
}

interface NominatimPlace {
    display_name: string
    lat: number
    lon: number
    place_id?: number
    class?: string
    type?: string
    importance?: number
    icon?: string
}

export default create<State & Action>((set, get) => {

    const playerMarker = new Marker();
    const destMarker = new Marker();

    return {
        navigating: false,
        recording: false,
        tracking: false,
        map: null,
        playerMarker: playerMarker,
        playerValid: false,
        destMarker: destMarker,

        destination: null,
        dest_search: "",

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
            if (state.map) {
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
                marker.setLngLat(point);
                marker.addTo(map);
                set(() => ({ playerValid: true }));

                if (get().tracking) {
                    map.panTo(point, { animate: true, duration: 0.1 });
                }
            }
        },

        clearPlayerPosition: () => {
            get().playerMarker.remove();
            set(() => ({ playerValid: false }));
        },

        // Geocoding Actions
        updateSearchBox: value => set(() => ({ dest_search: value })),
        requestGeocodingLookup: query => {
            fetch(NOMINATIM_URL + "/search?" + new URLSearchParams({
                q: query,
                format: "jsonv2",
                limit: "3",
            }).toString())
                .then(response => response.json())
                .then(data => get().recieveGeocodingResponse(data))
        },

        requestReverseGeocodingLookup: location => {
            // Abort if we are currently naviagting to a different location
            if (get().navigating) {
                return;
            }

            fetch(NOMINATIM_URL + "/reverse?" + new URLSearchParams({
                lat: location.lat.toString(),
                lon: location.lng.toString(),
                format: "jsonv2",
            }).toString())
                .then(response => response.json())
                .then(data => {
                    const recieveGeocoding = get().recieveGeocodingResponse;
                    if ("error" in data) {
                        // Fall back to just the GPS coordinates
                        const lat = location.lat;
                        const lon = location.lng;
                        recieveGeocoding([{
                            display_name: `${lat},${lat}`,
                            lat,
                            lon,
                        }]);
                    } else {
                        recieveGeocoding([data as NominatimPlace])
                    }
                })
        },

        recieveGeocodingResponse: data => {
            const marker = get().destMarker;
            const map = get().map;
            if (!map) {
                return;
            }

            if (data.length === 0 || "error" in data[0]) {
                marker.remove();
                set(() => ({ destination: null }));
            } else {
                console.log(`Navigating to ${data[0].display_name}`)
                const name = data[0].display_name;
                const location = new LngLat(data[0].lon, data[0].lat);
                set(() => ({ dest_search: name, destination: location }));

                marker.setLngLat(location);
                marker.addTo(map);

                if (!get().tracking) {
                    map.panTo(location);
                }
            }

        },

        // Routing Options
        requestDirections: () => {
            if (get().destination === null || !get().playerValid) {
                return;
            }

            const src = get().playerMarker.getLngLat();
            const dest = get().destination!;

            fetch(VALHALLA_URL + "/route?" + new URLSearchParams({
                json: JSON.stringify(createDirectionsRequest(src, dest)),
            }))
                .then(response => response.json())
                .then(get().recieveDirections);
            // TODO handle failed lookup
        },

        recieveDirections: (data) => {
            const map = get().map;
            if (!map) {
                return;
            }

            const route = parsePolylines(data.trip);
            map.addLayer({
                id: "route",
                type: "line",
                source: {
                    type: "geojson",
                    data: {
                        type: "Feature",
                        geometry: {
                            type: "LineString",
                            coordinates: route,
                        },
                        properties: {
                            title: "Route line"
                        }
                    },
                },
                paint: {
                    "line-color": "#5072c9",
                    "line-opacity": 0.6,
                    "line-width": 8,
                },
            });

            set(() => ({ navigating: true }));
        },

        exitNavigation: () => {
            const map = get().map;
            if (map) {
                map.removeLayer("route");
                map.removeSource("route");
            }
            set(() => ({ navigating: false }));
        },
    }
});

