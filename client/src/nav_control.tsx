// Modified version of maplibre-gl's default navigation controls.
//
import { NavigationControl, NavigationControlOptions } from "maplibre-gl";

export default class FollowNavigationControl extends NavigationControl {
    constructor(rotationCallback: (e?: any) => void, options?: NavigationControlOptions) {
        super(options);

        this._compass.remove();
        this._compassIcon.remove();
        this._compass = this._createButton('maplibregl-ctrl-compass', rotationCallback);

        this._compassIcon = window.document.createElement('span');
        this._compassIcon.className = 'maplibregl-ctrl-icon';
        this._compass.appendChild(this._compassIcon);
        this._compassIcon.setAttribute('aria-hidden', 'true');

        // Original button handler:
        // if (this.options.visualizePitch) {
        //     this._map.resetNorthPitch({}, { originalEvent: e });
        // } else {
        //     this._map.resetNorth({}, { originalEvent: e });
        // }
    }
}
