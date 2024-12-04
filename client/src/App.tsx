import Map from "./Map";
import Controls from "./Controls";
import Navigation from "./Navigation";

import "./App.css";

export default function App() {
    return (
        <div className="app">
            <Controls />
            <Navigation />
            <Map />
        </div>
    );
}
