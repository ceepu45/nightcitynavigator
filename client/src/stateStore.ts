import { create } from 'zustand'
import { Map, LngLat, Marker, GeoJSONSource } from "maplibre-gl";
import { createDirectionsRequest, parseManeuvers, parsePolylines, projectToSegment } from './valhalla';
import { RouteResponse, Maneuver } from './valhallaTypes';
import playerSvg from "./navigation-2.svg";
import { toaster } from "@/components/ui/toaster"
import { NOMINATIM_URL, VALHALLA_URL } from "./config"

const MAX_POSITION_AGE = 10000;

const ROUTE_DISTANCE_SQ_MAX = 50 * 50;

interface NavInfo {
    route: [number, number][]
    maneuvers: Maneuver[]
}

type State = {
    recording: boolean
    tracking: boolean
    trackingRotation: boolean
    map: Map | null

    playerMarker: Marker
    playerHeading: number
    debugMarker: Marker
    playerValid: boolean
    destMarker: Marker

    destination: LngLat | null
    dest_search: string

    navRoute: NavInfo | null
    navCalcInProgress: boolean
    currentSegment: number
    currentManeuver: number
}

type Action = {
    setRecording: (recording: boolean) => void
    setTracking: (tracking: boolean) => void
    setTrackingRotation: (trackingRotation: boolean) => void
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
    updateRouteLine: () => void

    handleDirectionError: (error: any) => void
    handleGeocodingError: (error: any) => void

    exitNavigation: () => void
    updateNavigation: () => void
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

    const playerElement = new Image(40, 40);
    playerElement.className = "marker";
    playerElement.src = playerSvg;
    //playerElement.style.background = `url("${playerSvg}")`;
    //playerElement.style.width = "40px";
    //playerElement.style.height = "40px";

    const playerMarker = new Marker({ element: playerElement });
    const debugMarker = new Marker({ color: "#FF0000" });
    const destMarker = new Marker({ color: "#8888FF" });

    return {
        recording: false,
        tracking: true,
        trackingRotation: false,
        map: null,
        playerMarker: playerMarker,
        playerHeading: 0.0,
        debugMarker: debugMarker,
        playerValid: false,
        destMarker: destMarker,

        destination: null,
        dest_search: "",

        navRoute: null,
        navCalcInProgress: false,
        currentSegment: 0,
        currentManeuver: 0,

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

        setTrackingRotation: trackingRotation => set((state) => {
            const newTracking = trackingRotation && state.tracking;
            if (state.map && !newTracking) {
                state.map.rotateTo(0);
            }

            // Only track rotation when the player is being tracked. Otherwise, just reset rotation.
            return { trackingRotation: newTracking };
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
                const bearing = (data.heading * 180.0 / 3.14159);
                marker.setLngLat(point);
                marker.addTo(map);
                set(() => ({ playerValid: true, playerHeading: bearing }));

                // combine map rotation and tracking into one ease movement, so they don't interrupt each other.
                let mapPosition = undefined;
                let mapRotation = map.getBearing();
                if (get().tracking) {
                    mapPosition = point;
                }
                if (get().trackingRotation) {
                    mapRotation = -bearing;
                }

                // Don't interrupt any other transformation animation going on.
                if (!map.scrollZoom.isActive() && !map.isEasing() && (mapPosition !== undefined)) {
                    map.easeTo({
                        center: mapPosition,
                        bearing: mapRotation,
                    });
                    /*
                    map.easeTo({
                        center: mapPosition,
                        bearing: mapRotation,

                        duration: 200,
                        easing: x => x,
                    });
                        */
                }

                marker.setRotation(-bearing - map.getBearing());
            }

            if (get().navRoute) {
                get().updateNavigation();
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
                .then(async response => {
                    if (!response.ok) {
                        throw new Error("HTTP Status: " + response.status);
                    }
                    return response.json();
                })
                .then(data => get().recieveGeocodingResponse(data))
                .catch(get().handleGeocodingError);
        },

        requestReverseGeocodingLookup: location => {
            // Abort if we are currently naviagting to a different location
            if (get().navRoute != null) {
                return;
            }

            fetch(NOMINATIM_URL + "/reverse?" + new URLSearchParams({
                lat: location.lat.toString(),
                lon: location.lng.toString(),
                format: "jsonv2",
            }).toString())
                .then(async response => {
                    if (!response.ok) {
                        throw new Error("HTTP Status: " + response.status);
                    }
                    return response.json();
                })
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
                .catch(get().handleGeocodingError);
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

            if (get().navCalcInProgress) {
                return;
            }

            const src = get().playerMarker.getLngLat();
            const dest = get().destination!;


            set(() => ({ navCalcInProgress: true }));
            fetch(VALHALLA_URL + "/route?" + new URLSearchParams({
                json: JSON.stringify(createDirectionsRequest(src, dest, get().playerHeading)),
            }))
                .then(async response => {
                    if (!response.ok) {
                        const data = await response.json();
                        if (data.error !== undefined) {
                            throw new Error(data.error);
                        }
                        throw new Error(data);
                    }

                    return response.json();
                })
                .then(get().recieveDirections)
                .catch(get().handleDirectionError);
        },

        recieveDirections: (data) => {
            const map = get().map;
            if (!map) {
                return;
            }

            const route = parsePolylines(data.trip);
            const maneuvers = parseManeuvers(data.trip);
            const newRoute: NavInfo = { route, maneuvers };
            console.log(newRoute);

            // Start navigation, and start tracking the player.
            set(() => ({ navRoute: newRoute, currentSegment: 0, nextSegment: 0, currentManeuver: 0, nextManeuver: 0, tracking: true, navCalcInProgress: false }));
            get().updateRouteLine();
        },

        handleDirectionError: (error) => {
            console.error("Failed to look up directions: " + error);
            toaster.create({ title: "Failed to look up directions", description: error.toString(), type: "error" });
            set(() => ({ navCalcInProgress: false }));
        },

        handleGeocodingError: (error) => {
            console.error("Failed to look up location: " + error);
            toaster.create({ title: "Failed to look up location", description: error.toString(), type: "error" });
        },

        updateRouteLine: () => {
            const map = get().map;
            const navRoute = get().navRoute;
            const currSegment = get().currentSegment;
            if (!map || !navRoute) {
                return;
            }

            const route = navRoute.route.slice(currSegment);

            const routeJson: GeoJSON.GeoJSON = {
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: route,
                },
                properties: {
                    title: "Route line"
                }
            };
            let routeSource: GeoJSONSource | undefined = map.getSource("route");
            if (routeSource) {
                routeSource.setData(routeJson);
            } else {
                map.addLayer({
                    id: "route",
                    type: "line",
                    source: {
                        type: "geojson",
                        data: routeJson,
                    },
                    paint: {
                        "line-color": "#5072c9",
                        "line-opacity": 0.6,
                        "line-width": 8,
                    },
                });
            }
        },

        exitNavigation: () => {
            const map = get().map;
            if (map) {
                map.removeLayer("route");
                map.removeSource("route");
            }
            set(() => ({ navRoute: null }));
        },

        updateNavigation: () => {
            const map = get().map;
            const navRoute = get().navRoute;
            const currSegment = get().currentSegment;
            if (!map || !navRoute) {
                return;
            }

            const playerPosition = get().playerMarker.getLngLat();
            const segmentStart = navRoute.route[currSegment];
            const segmentEnd = navRoute.route[currSegment + 1];
            const { percent, distanceSq, point } = projectToSegment(segmentStart, segmentEnd, playerPosition);

            // get().debugMarker.setLngLat(point.toLngLat());
            // get().debugMarker.addTo(map);

            // If the player deviates from the route, recalculate the path.
            if (distanceSq > ROUTE_DISTANCE_SQ_MAX && !get().navCalcInProgress) {
                console.log(`Recalculating route (${distanceSq})`);
                get().requestDirections();
            } else if (percent >= 1.0) {
                // console.log(`Updating route progression (${percent}) (${currSegment})`)
                if (currSegment + 2 >= navRoute.route.length) {
                    console.log("Navigation Complete");
                    get().exitNavigation();
                } else {
                    set((state) => {
                        const nextSegment = state.currentSegment + 1;
                        const currManeuver = state.navRoute!.maneuvers[state.currentManeuver];
                        let nextManeuver = state.currentManeuver;
                        if (nextSegment >= currManeuver.begin_shape_index) {
                            nextManeuver += 1;
                            // const m = state.navRoute!.maneuvers[nextManeuver];
                            // console.log(`Next maneuver: '${m.instruction}' (${m.begin_shape_index} .. ${m.end_shape_index})`);
                        }
                        // console.log(`current segment: ${nextSegment}`);

                        return { currentSegment: nextSegment, currentManeuver: nextManeuver };
                    });
                }
            } else {
                set((state) => {
                    const route = state.navRoute!.route.slice();
                    const maneuvers = state.navRoute!.maneuvers.slice();
                    route[state.currentSegment] = point.toLngLat().toArray();

                    const newRoute = { route, maneuvers };
                    return { navRoute: newRoute };
                });
            }

            get().updateRouteLine();
        }
    }
});

