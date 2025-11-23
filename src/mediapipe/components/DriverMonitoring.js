// javascript
import React, {useCallback, useRef, useState, useContext} from 'react';
import Webcam from 'react-webcam';
import {calculateEAR} from '../utils/calculateEAR';
import {useFaceMesh} from '../hooks/useFaceMesh';
import {useWebSocket} from '../hooks/useWebSocket';
import CanvasOverlay from './CanvasOverlay';
import StatusDisplay from './StatusDisplay';
import { RecordingContext } from '../../components/SessionRecording';

const EAR_THRESHOLD = 0.2; // immediate eye-closed alert threshold
const FOCUS_UPDATE_INTERVAL = 2000; // ms

// Focus EAR mapping constants
const FOCUS_EAR_MIN_MAP = EAR_THRESHOLD; // mapuje do 0%
const FOCUS_EAR_LEVEL_1 = 0.27; // mapuje do 25%
const FOCUS_EAR_LEVEL_2 = 0.35; // mapuje do 50%
const FOCUS_EAR_MAX_MAP = 0.4;  // mapuje do 100%

function mapEarToFocusPercent(EAR) {
    if (typeof EAR !== 'number' || isNaN(EAR)) return 100;

    if (EAR >= FOCUS_EAR_MAX_MAP) return 100;
    if (EAR <= FOCUS_EAR_MIN_MAP) return 0;

    let focusPercent;

    // range 1 - 0% to 25%
    if (EAR < FOCUS_EAR_LEVEL_1) {
        const rangeEar = FOCUS_EAR_LEVEL_1 - FOCUS_EAR_MIN_MAP;
        const earInRange = EAR - FOCUS_EAR_MIN_MAP;
        const rangeFocus = 25;

        focusPercent = rangeFocus * (earInRange / rangeEar);

        // range 2 - 25% to 50%
    } else if (EAR < FOCUS_EAR_LEVEL_2) {
        const rangeEar = FOCUS_EAR_LEVEL_2 - FOCUS_EAR_LEVEL_1;
        const earInRange = EAR - FOCUS_EAR_LEVEL_1;
        const rangeFocus = 25;

        focusPercent = 25 + rangeFocus * (earInRange / rangeEar);

        // range 3 - 50% to 100%
    } else {
        const rangeEar = FOCUS_EAR_MAX_MAP - FOCUS_EAR_LEVEL_2;
        const earInRange = EAR - FOCUS_EAR_LEVEL_2;
        const rangeFocus = 50;

        focusPercent = 50 + rangeFocus * (earInRange / rangeEar);
    }

    return Math.round(focusPercent);
}

export default function DriverMonitoring() {
    const webcamRef = useRef(null);
    const latestEAR = useRef(null);

    const { addEvent, setFocusPercent } = useContext(RecordingContext);

    const [status, setStatus] = useState('idle');
    const [faceCount, setFaceCount] = useState(0);
    const [currentEAR, setCurrentEAR] = useState(null);
    const [landmarks, setLandmarks] = useState(null);

    const { isConnected } = useWebSocket(latestEAR);

    const lastFocusAlertRef = useRef(false);
    const lastFocusUpdateRef = useRef(0);

    // Accumulators for EAR samples within the period
    // keep raw EAR samples for the current period; we'll take average of top N
    const earSamplesRef = useRef([]);
    const TOP_N_SAMPLES = 10;

    const onResults = useCallback((results) => {
        if (!results.image) return;
        const faces = results.multiFaceLandmarks || [];
        setFaceCount(faces.length);

        setStatus(faces.length === 0
            ? 'no faces detected'
            : `faces detected: ${faces.length} | WS: ${isConnected ? 'Connected' : 'Connecting...'}`
        );

        const now = Date.now();

        if (faces.length > 0) {
            const landmarks = faces[0];
            setLandmarks(landmarks);

            const leftEyeIndices = [362, 380, 374, 263, 386, 385];
            const rightEyeIndices = [33, 159, 158, 133, 153, 145];

            const leftEye = leftEyeIndices.map(i => landmarks[i]);
            const rightEye = rightEyeIndices.map(i => landmarks[i]);

            const leftEAR = calculateEAR(leftEye);   // raw EAR (e.g. 0.09 - 0.4)
            const rightEAR = calculateEAR(rightEye);

            // average raw EAR for this frame
            const rawAvgEar = (leftEAR + rightEAR) / 2;

            // accumulate for period averaging
            if (typeof rawAvgEar === 'number' && !isNaN(rawAvgEar)) {
                // push into samples array (we'll trim/reset on interval)
                earSamplesRef.current.push(rawAvgEar);
            }

            // update currentEAR shown in UI (rounded)
            setCurrentEAR(Number(rawAvgEar.toFixed(3)));
            latestEAR.current = rawAvgEar;

            // immediate eyes-closed event using raw EAR
            if (rawAvgEar < EAR_THRESHOLD) {
                console.log('Eyes closed! EAR=', rawAvgEar);
                addEvent && addEvent('Eyes closed detected', 'warning');
            }

            // Throttle updates to context every FOCUS_UPDATE_INTERVAL ms
            if (now - lastFocusUpdateRef.current >= FOCUS_UPDATE_INTERVAL) {
                const samplesArray = earSamplesRef.current;
                let avgEarForPeriod = null;
                if (samplesArray.length > 0) {
                    // compute average of TOP_N_SAMPLES highest EARs
                    const topSamples = samplesArray.slice().sort((a, b) => b - a).slice(0, TOP_N_SAMPLES);
                    const sumTop = topSamples.reduce((s, v) => s + v, 0);
                    avgEarForPeriod = sumTop / topSamples.length;
                }

                // reset samples for next period
                earSamplesRef.current = [];

                // If we have a computed average EAR for the period, map to percent
                const focusPercentComputed = (avgEarForPeriod === null)
                    ? 100
                    : mapEarToFocusPercent(avgEarForPeriod);

                setFocusPercent && setFocusPercent(focusPercentComputed);
                lastFocusUpdateRef.current = now;

                // emit low-focus event only on updates (throttled)
                if (focusPercentComputed < 50 && !lastFocusAlertRef.current) {
                    addEvent && addEvent(`Focus level low: ${focusPercentComputed}%`, 'warning');
                    lastFocusAlertRef.current = true;
                } else if (focusPercentComputed >= 50) {
                    lastFocusAlertRef.current = false;
                }
            }
        } else {
            // no face -> reset accumulators and treat as 100% focus (or change if desired)
            setLandmarks(null);
            setCurrentEAR(null);
            latestEAR.current = null;
            earSamplesRef.current = [];
            setFocusPercent && setFocusPercent(100);
            lastFocusUpdateRef.current = now;
            lastFocusAlertRef.current = false;
        }
    }, [isConnected, addEvent, setFocusPercent]);

    const { startFaceMesh, isLoading } = useFaceMesh(webcamRef, onResults);

    const videoWidth = 640;
    const videoHeight = 480;

    return (
        <div style={{ position: 'relative', width: videoWidth, height: videoHeight, margin: '0 auto' }}>
            {isLoading && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: 10, borderRadius: 5 }}>
                    Loading face detection...
                </div>
            )}

            <StatusDisplay status={status} faceCount={faceCount} currentEAR={currentEAR} />

            <Webcam
                ref={webcamRef}
                onUserMedia={startFaceMesh}
                mirrored={true}
                style={{
                    position: 'absolute',
                    width: videoWidth,
                    height: videoHeight,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    objectFit: 'cover',
                    zIndex: 1,
                }}
            />

            {landmarks && <CanvasOverlay videoWidth={videoWidth} videoHeight={videoHeight} landmarks={landmarks} />}
        </div>
    );
}
