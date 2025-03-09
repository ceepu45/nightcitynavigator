import Map from "./Map";
import Controls from "./Controls";
import Navigation from "./Navigation";
import { Toaster } from "@/components/ui/toaster"

import "./App.css";

export default function App() {
    return (
        <div className="app">
            <Controls />
            <Navigation />
            <Map />
            <Toaster />
        </div>
    );
}
