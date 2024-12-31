import { LngLat, MercatorCoordinate } from "maplibre-gl";
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
    const coordinates: [number, number][] = []
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
    const route: [number, number][] = []
    for (const leg of trip.legs) {
        route.push(...decodeLine(leg.shape));
    }

    return route;
}

export function parseManeuvers(trip: Trip) {
    return trip.legs.flatMap((leg, idx, legs) => {
        if (idx !== 0) {
            const offset = legs[idx - 1].shape.length;
            return leg.maneuvers.map(m => {
                m.begin_shape_index += offset;
                m.end_shape_index += offset;
                return m;
            });
        } else {
            return leg.maneuvers;
        }
    });
}

export function projectToSegment(segmentStart: [number, number], segmentEnd: [number, number], position: LngLat) {
    const segmentStartMerc = MercatorCoordinate.fromLngLat(segmentStart, 0);
    const segmentEndMerc = MercatorCoordinate.fromLngLat(segmentEnd, 0);
    const positionMerc = MercatorCoordinate.fromLngLat(position, 0);

    // Subtract start and end to get segment vector, and position vector.
    const segX = segmentEndMerc.x - segmentStartMerc.x;
    const segY = segmentEndMerc.y - segmentStartMerc.y;

    const posX = positionMerc.x - segmentStartMerc.x;
    const posY = positionMerc.y - segmentStartMerc.y;

    const dotProduct = segX * posX + segY * posY;
    const segLengthSq = segX * segX + segY * segY;


    // Calculate percent along vector
    let percent;
    if (segLengthSq == 0.0) {
        percent = 0
    } else {
        percent = dotProduct / segLengthSq;
    }



    const point = new MercatorCoordinate(segmentStartMerc.x + segX * percent, segmentStartMerc.y + segY * percent);

    const deltaX = positionMerc.x - point.x;
    const deltaY = positionMerc.y - point.y;
    const scale = 1 / point.meterInMercatorCoordinateUnits();
    const distanceSq = (deltaX * deltaX + deltaY * deltaY) * scale * scale;

    return { percent, distanceSq, point };
}
