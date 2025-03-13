import { useEffect, useRef } from "react";
import maplibregl, { LngLatBounds } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import useStateStore from "@/stateStore";
import { TILE_URL } from "./config";

import "./Map.css";
import FollowNavigationControl from "./nav_control";

export default function Map() {
    const mapContainer = useRef(null);
    const setMap = useStateStore((state) => state.setMap);
    const setPlayerPosition = useStateStore((state) => state.setPlayerPosition);
    const clearPlayerPosition = useStateStore((state) => state.clearPlayerPosition);
    const setTracking = useStateStore((state) => state.setTracking);
    const toggleTrackingRotation = useStateStore((state) => state.toggleTrackingRotation);
    const requestReverseGeocodingLookup = useStateStore((state) => state.requestReverseGeocodingLookup);

    useEffect(() => {
        let bounds = new LngLatBounds([-0.1, -0.1], [0.1, 0.1]);
        const map = new maplibregl.Map({
            container: mapContainer.current!,
            style: {
                "version": 8,
                "sources": {
                    "raster-tiles": {
                        "type": "raster",
                        "tiles": [
                            TILE_URL,
                        ],
                        "tileSize": 256,
                        "attribution": "Game data (c) CDProjektRed, Map (c) Night City Mapping Project and contributors"
                    }
                },
                "layers": [
                    {
                        "id": "main-tiles",
                        "type": "raster",
                        "source": "raster-tiles",
                        "minzoom": 11,
                        "maxzoom": 20
                    },
                ]
            },
            center: [0.0, 0.0],
            zoom: 14,
            minZoom: 11,
            maxZoom: 19,
            maxBounds: bounds
        });

        // Disable tracking when starting a drag.
        map.on("mousedown", (e) => {
            const button = e.originalEvent.button
            if (button === 0) {
                // Left click
                setTracking(false);
            } else if (button == 2) {
                // Right click
                requestReverseGeocodingLookup(e.lngLat);
                e.preventDefault();
            }
        });

        map.addControl(new FollowNavigationControl(_ => {
            toggleTrackingRotation();
        }, {
            visualizePitch: true,
            showZoom: true,
            showCompass: true
        }));

        setMap(map);
    }, []);

    useEffect(() => {
        function update() {
            fetch("/api/location")
                .then(response => response.json())
                .then(setPlayerPosition)
                .catch(clearPlayerPosition);
            window.requestAnimationFrame(update);
        }
        update();
    }, []);

    return <div ref={mapContainer} className="map" />;
}
