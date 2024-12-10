import { LngLat } from "maplibre-gl";
import { Trip } from "./valhallaTypes";


function createLocation(loc: LngLat) {
    // TODO include player heading
    return {
        lat: loc.lat,
        lon: loc.lng,
        type: "break",
    }
}

export function createDirectionsRequest(src: LngLat, dst: LngLat) {
    // TODO costing options
    const data = {
        locations: [
            createLocation(src),
            createLocation(dst),
        ],
        costing: "auto",
        units: "kilometers",
        format: "json",
    };

    return data;
}

function decodeLine(line: string) {
    const coordinates = []
    let lat = 0;
    let lng = 0;
    const factor = 1.0 / Math.pow(10, 6);
    // Each loop iteration decodes a single coordinate.
    let index = 0;
    while (index < line.length) {
        let byte = 0;
        let shift = 0;
        let result = 0;

        do {
            byte = line.charCodeAt(index) - 63;
            index++;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        let latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        shift = 0;
        result = 0;
        do {
            byte = line.charCodeAt(index) - 63;
            index++;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        let longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));


        lat += latitude_change;
        lng += longitude_change;

        coordinates.push([lng * factor, lat * factor]);
    }

    return coordinates;
}

export function parsePolylines(trip: Trip) {
    const route = []
    for (const leg of trip.legs) {
        route.push(...decodeLine(leg.shape));
    }

    return route;
}
