import './App.css';
import DriverMonitoring from "./mediapipe/components/DriverMonitoring";
import {GaugeComponent} from "react-gauge-component";
import React from "react";

function App() {
    return (
        <div className="App">
            <div className="camera">
                <DriverMonitoring />
            </div>
            <div className="gauge" style={{ marginTop: '20px', maxWidth: '1020px' }}>
                <GaugeComponent
                    size={200}
                    value={10}
                    minValue={0}
                    maxValue={100}
                    label="Driver Alertness"
                    color="#FF0000"

                />
            </div>
        </div>
    );
}
export default App;
