import './App.css';
import DriverMonitoring from "./mediapipe/components/DriverMonitoring";
import {GaugeComponent} from "react-gauge-component";
import React from "react";

function App() {
    return (
        <div className="App">
            <div className="camera">
                <DriverMonitoring/>
            </div>
            <div className="gauge" style={{marginTop: '20px'}}>
                <GaugeComponent
                    id="gauge-component2"
                    value={80}
                    pointer={{type: "arrow", elastic: true}}
                    range={{min: 0, max: 100}}
                    width={300}
                    height={200}
                    arc={{
                        width: 0.3,
                        subArcs: [
                            {
                                limit: 50,
                                color: '#00FF00',
                                showTick: true
                            },
                            {
                                limit: 75,
                                color: '#FFFF00',
                                showTick: true
                            },
                            {
                                limit: 100,
                                color: '#FF0000'
                            }
                        ]
                    }}
                    // Remove the deprecated/incorrect properties for this configuration
                    // segments={10}
                    // arcWidth={0.3}
                    // colors={['#FF0000', '#FFFF00', '#00FF00']}
                    needleColor={"#000000"}
                    textColor={"#000000"}
                />
            </div>
        </div>
    );
}

export default App;
