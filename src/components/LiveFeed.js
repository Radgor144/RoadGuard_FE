import React, {useContext} from 'react';
import DriverMonitoring from "../mediapipe/components/DriverMonitoring";
import {RecordingProvider, RecordingButton, BreakButton, RecordingContext, formatTime} from "./SessionRecording";

const FatigueGauge = ({value}) => {
    const radius = 60;
    const strokeWidth = 10;
    // Full circumference (used for dash array calculations)
    const circumference = 2 * Math.PI * radius;
    // The visible part of the gauge is 270 degrees (3/4 of a circle)
    const arcLength = (270 / 360) * circumference;

    // Defines the progress length based on the value (0-100%) against the total arc length
    const progressLength = (value / 100) * arcLength;

    // The amount of stroke remaining to hide
    const strokeDashoffset = arcLength - progressLength;

    // Defines the arc (270 length) followed by the gap (90 length)
    const strokeDasharray = `${arcLength} ${circumference - arcLength}`;


    let colorClass = 'stroke-green-500';
    let message = 'Normal';

    if (value >= 65) {
        colorClass = 'stroke-red-500';
        message = 'DANGER: Stop Driving';
    } else if (value >= 35) {
        colorClass = 'stroke-yellow-500';
        message = 'High Fatigue';
    }

    // Define the base color for the path (gray background)
    const baseColor = 'stroke-gray-700';

    return (
        <div className="flex flex-col items-center justify-start p-4 h-full">
            <h3 className="text-lg font-semibold text-gray-200 mb-6">Fatigue Level</h3>
            <div className="relative w-40 h-36">
                {/*
          The SVG is rotated by -135 degrees.
          The 0 degree start point is usually at 3 o'clock.
          -135 degrees rotates the start point to 7:30 o'clock,
          making the 270-degree arc cover from 7:30 to 4:30, with a gap at the bottom center.
        */}
                <svg className="w-full h-full transform -rotate-135" viewBox="0 0 140 140">
                    {/* Background Arc */}
                    <circle
                        cx="70"
                        cy="70"
                        r={radius}
                        fill="transparent"
                        stroke={baseColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDasharray}
                        strokeLinecap="round"
                    />
                    {/* Progress Arc */}
                    <circle
                        cx="70"
                        cy="70"
                        r={radius}
                        fill="transparent"
                        stroke={colorClass}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        style={{transition: 'stroke-dashoffset 0.5s ease-in-out'}}
                    />
                </svg>
                <div className="absolute top-[65%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <span className="text-4xl font-bold text-white">{value}%</span>
                </div>
            </div>
            <p className={`mt-2 text-sm font-medium ${value >= 65 ? 'text-red-400' : 'text-gray-400'}`}>
                {message}
            </p>
        </div>
    );
};

export const LiveFeed = () => {

    const {
        isRecording,
        elapsedTime,
        isTakingBreak,
        timeSinceLastBreak
    } = useContext(RecordingContext);

    const lastBreakDisplay = () => {
        if (isTakingBreak) {
            return <span className="text-yellow-400 font-semibold">Break Active</span>;
        }
        if (timeSinceLastBreak > 0) {
            // Display the time since last break
            return <span className={`font-semibold ${timeSinceLastBreak > 3600 ? 'text-red-400' : 'text-green-400'}`}>
                {formatTime(timeSinceLastBreak)} ago
            </span>;
        }
        // No break has been recorded yet in this session
        return <span className="font-semibold text-gray-500">N/A</span>;
    };

    const fatigueLevel = 20;

    return (
        <RecordingProvider>
            <div className="bg-gray-900 text-white p-4 sm:p-8 flex items-center justify-center font-sans">
                <div className="bg-gray-800 rounded-3xl shadow-2xl w-full max-w-*">

                    {/* Main Content Grid */}
                    <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">

                        {/* Camera Feed & Gauges (Left Column - Spans 2/3 on desktop) */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Camera Feed  */}
                            <div
                                className="bg-gray-900 rounded-xl overflow-hidden shadow-xl aspect-video relative flex items-center justify-center">
                                <DriverMonitoring/>
                            </div>

                            {/* Gauges/Controls Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Gauge Driver Fatigue */}
                                <div
                                    className="bg-gray-900 rounded-xl shadow-lg flex items-start justify-center p-4 pt-8">
                                    <FatigueGauge value={fatigueLevel}/>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    {/* ecording Control */}
                                    <div
                                        className="bg-gray-900 rounded-xl shadow-lg flex items-center justify-center p-4">
                                        <div className="buttons-row-layout w-full max-w-lg">
                                            <RecordingButton/>
                                            <BreakButton/>
                                        </div>
                                    </div>
                                    <p className={`status-text ${isTakingBreak ? 'status-break' : 'status-ready'}`}>
                                        Status: {isTakingBreak ? "Break Active (Driving Paused)" : (isRecording ? "Ready for Break" : "Recording Required")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Data Panels (Right Column - Spans 1/3 on desktop) */}
                        <div className="lg:col-span-1 space-y-6">

                            {/* Current Status */}
                            <div className="bg-gray-900 p-5 rounded-xl shadow-lg">
                                <h2 className="text-xl font-bold mb-3 text-indigo-400">Current Status</h2>
                                <div className="space-y-2 text-gray-300">
                                    <p>Driving Duration: <span
                                        className="font-semibold">{formatTime(elapsedTime)}</span></p>
                                    <p>Last Break: <span className="font-semibold">{lastBreakDisplay()}</span></p>
                                    <p className="pt-2 text-sm text-yellow-400 font-medium">
                                        {/*{fatigueLevel >= 35 ? 'Recommendation: Take a break now.' : 'Status: Optimal driving conditions.'} - to implement later*/}
                                        Status: Optimal driving conditions.
                                    </p>
                                </div>
                            </div>

                            {/* Real-time Data */}
                            <div className="bg-gray-900 p-5 rounded-xl shadow-lg">
                                <h2 className="text-xl font-bold mb-3 text-indigo-400">Real-time Data</h2>
                                <div className="space-y-2 text-gray-300">
                                    <p className="flex justify-between">
                                        <span>Eye Closure Ratio (PERCLOS):</span>
                                        <span
                                            // className={`font-semibold ${fatigueLevel > 50 ? 'text-red-400' : 'text-green-400'}`}>{(fatigueLevel / 10).toFixed(1)}% - to implement later
                                            className="font-semibold text-green-400">12%
                  </span>
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

                            {/* Alert History */}
                            <div className="bg-gray-900 p-5 rounded-xl shadow-lg">
                                <h2 className="text-xl font-bold mb-3 text-indigo-400">Alert History</h2>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li className="border-l-2 border-red-500 pl-3">
                                        <span className="font-semibold text-white">10:32 AM:</span> Microsleep Detected
                                    </li>
                                    <li className="border-l-2 border-yellow-500 pl-3">
                                        <span className="font-semibold text-white">10:30 AM:</span> Lane Departure
                                        Warning
                                    </li>
                                    <li className="border-l-2 border-green-500 pl-3">
                                        <span className="font-semibold text-white">10:28 AM:</span> Yawn Detected
                                    </li>
                                </ul>
                            </div>

                        </div>
                    </main>

                    {/* Footer/System Status */}
                    <footer className="p-4 border-t border-gray-700">
                        <p className={`text-sm font-medium ${isRecording ? 'text-green-400' : 'text-gray-500'}`}>
                            System Status: Monitoring... {isRecording && ' (Video Recording in Progress)'}
                        </p>
                    </footer>

                </div>
            </div>
        </RecordingProvider>
    );
};

export default LiveFeed;
