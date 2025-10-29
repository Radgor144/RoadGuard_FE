import './App.css';
import DriverMonitoring from "./mediapipe/components/DriverMonitoring";
import {GaugeComponent} from "react-gauge-component";
import React from "react";
import {RecordingButton} from "./components/SessionRecording";
import {BreakButton} from "./components/SessionRecording";
import {RecordingIndicator} from "./components/SessionRecording";
import {RecordingProvider} from "./components/SessionRecording";

function App() {
    return (
        <script src={"https://cdn.tailwindcss.com"}></script>,
        <div className="App">
            <div className="camera">
                <DriverMonitoring/>
            </div>
            <div className="gauge-needle">
                <GaugeComponent
                    type="semicircle"
                    arc={{
                        width: 0.2,
                        padding: 0.005,
                        cornerRadius: 1,
                        // gradient: true,
                        subArcs: [
                            {
                                limit: 50,
                                color: '#5BE12C',
                                showTick: true,
                                tooltip: {
                                    text: 'You\'re okay!'
                                }
                            },
                            {
                                limit: 75, color: '#F5CD19', showTick: true,
                                tooltip: {
                                    text: 'High temperature!'
                                }
                            },
                            {
                                color: '#EA4228',
                                tooltip: {
                                    text: 'Too high temperature!'
                                }
                            }
                        ]
                    }}
                    pointer={{
                        color: '#141d1a',
                        length: 0.80,
                        width: 15,
                        // elastic: true,
                    }}
                    value={40}
                    minValue={0}
                    maxValue={100}
                />
            </div>
            <div className="gauge" style={{marginTop: '20px'}}>
                <GaugeComponent
                    id="gauge-component3"
                    value={20}
                    pointer={{type: "arrow", elastic: true, width: 8, length: 70, color: "#000000", hide: false}}
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
                    needleColor={"#000000"}
                    textColor={"#000000"}
                />
            </div>
            <div>
                <RecordingProvider>
                    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-6">
                            Driver Timer App
                        </h1>

                        {/* 2. Place the components inside the Provider */}
                        <div className="flex space-x-4 mb-6">
                            <RecordingButton />
                            <BreakButton />
                        </div>

                        <RecordingIndicator />

                    </div>
                </RecordingProvider>
            </div>
        </div>
    );
}

export default App;
