import React, {} from 'react';
import DriverMonitoring from "../mediapipe/components/DriverMonitoring";
import {
    RecordingProvider,
    RecordingButton,
    BreakButton,
    RecordingContext,
    formatTime,
    SystemStatus,
    formatClock
} from "./SessionRecording";
import {GaugeComponent} from "react-gauge-component";
import EventHistory from "./EventHistory";

export const LiveFeed = () => {

    const Content = () => {
        const {
            isTakingBreak,
            timeSinceLastBreak,
            startTime
        } = React.useContext(RecordingContext);

        const lastBreakDisplay = () => {
            if (isTakingBreak) {
                return <span className="text-yellow-400 font-semibold">Break Active</span>;
            }
            if (timeSinceLastBreak > 0) {
                return <span
                    className={`font-semibold ${timeSinceLastBreak > 7200 ? 'text-red-400' : 'text-green-400'}`}>
                    {formatTime(timeSinceLastBreak)} ago
                </span>;
            }
            return <span className="font-semibold text-gray-500">N/A</span>;
        };

        const fatigueLevel = 20;

        return (
            <div className="transparent text-white p-4 sm:p-8 flex items-center justify-center font-sans"
                 style={{minHeight: 'calc(100vh - var(--nav-height, 72px))', paddingTop: 0, overflow: 'auto'}}>
                <div className="bg-gray-800 rounded-3xl shadow-2xl w-full max-w-7xl mx-auto overflow-hidden">

                    <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">

                        <div className="lg:col-span-2 space-y-6 min-w-0">

                            <div
                                className="bg-gray-900 rounded-xl overflow-hidden shadow-xl aspect-video relative flex items-center justify-center min-h-[520px] w-full max-w-full">
                                <DriverMonitoring/>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
                                <div
                                    className="bg-gray-900 rounded-xl shadow-lg flex flex-col items-center justify-center p-4 pt-8 md:col-span-1">
                                        <GaugeComponent
                                            value={fatigueLevel}
                                            type="radial"
                                            arc={{
                                                subArcs: [
                                                    {limit: 25, color: '#cb1224'},
                                                    {limit: 50, color: '#f59e0b'},
                                                    {limit: 100, color: '#1b875e'}
                                                ]
                                            }}
                                            pointer={{type: "needle", color: "#ffffff"}}
                                            labels={{
                                                valueLabel: {
                                                    formatTextValue: (v) => v + '%',
                                                    style: {fontSize: '40px', fill: '#fff'}
                                                }
                                            }}
                                            min={0}
                                            max={100}
                                            className="w-full h-90"
                                            marginInPercent={{top: 0.02, right: 0.02, bottom: 0.02, left: 0.02}}
                                        />
                                </div>

                                <div className="md:col-span-1 flex flex-col justify-between gap-6">
                                    <div
                                        className="bg-gray-900 rounded-xl shadow-lg flex flex-col items-center justify-center p-4 min-h-[140px] flex-grow">
                                        <div className="flex flex-col xs:flex-row gap-4 w-full max-w-lg">
                                            <RecordingButton/>
                                            <BreakButton/>
                                        </div>
                                    </div>
                                    <SystemStatus/>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-1 space-y-6 min-w-0">
                            <div className="bg-gray-900 p-5 rounded-xl shadow-lg">
                                <h2 className="text-xl font-bold mb-3 text-indigo-400">Current Status</h2>
                                <div className="space-y-2 text-gray-300">
                                    <p>Time Started: <span
                                        className="font-semibold">{startTime ? formatClock(startTime) : 'N/A'}</span>
                                    </p>
                                    <p>Last Break: <span className="font-semibold">{lastBreakDisplay()}</span></p>
                                </div>
                            </div>

                            <div className="bg-gray-900 p-5 rounded-xl shadow-lg">
                                <h2 className="text-xl font-bold mb-3 text-indigo-400">Real-time Data</h2>
                                <div className="space-y-2 text-gray-300">
                                    <p className="flex justify-between">
                                        <span>Eye Closure Ratio (PERCLOS):</span>
                                        <span className="font-semibold text-green-400">12%</span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span>Yawn Frequency:</span>
                                        <span className="font-semibold">0/min</span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span>Head Nodding:</span>
                                        <span className="font-semibold text-green-400">Low</span>
                                    </p>
                                </div>
                            </div>

                            <EventHistory />

                        </div>
                    </main>

                </div>
            </div>
        );
    };

    return (
        <RecordingProvider>
            <Content/>
        </RecordingProvider>
    );
};

export default LiveFeed;
