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

// Mapping range: EAR -> focusPercent
const FOCUS_EAR_MIN = 0.1; // maps to 0%
const FOCUS_EAR_MAX = 0.4; // maps to 100%

function mapEarToFocusPercent(avgEAR) {
    if (typeof avgEAR !== 'number' || isNaN(avgEAR)) return 100;
    if (avgEAR <= FOCUS_EAR_MIN) return 0;
    if (avgEAR >= FOCUS_EAR_MAX) return 100;
    const ratio = (avgEAR - FOCUS_EAR_MIN) / (FOCUS_EAR_MAX - FOCUS_EAR_MIN);
    return Math.round(Math.max(0, Math.min(1, ratio)) * 100);
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

            const leftEAR = calculateEAR(leftEye);
            const rightEAR = calculateEAR(rightEye);
            const avgEAR = (leftEAR + rightEAR) / 2;
            const roundedEAR = Number(avgEAR.toFixed(3));

            setCurrentEAR(roundedEAR);
            latestEAR.current = roundedEAR;

            // immediate eyes-closed event (legacy behavior)
            if (avgEAR < EAR_THRESHOLD) {
                console.log('Eyes closed! EAR=', avgEAR);
                addEvent && addEvent('Eyes closed detected', 'warning');
            }

            // Compute focus percent using linear mapping between FOCUS_EAR_MIN..FOCUS_EAR_MAX
            const focusPercentComputed = mapEarToFocusPercent(avgEAR);

            // Throttle updates to context every FOCUS_UPDATE_INTERVAL ms
            if (now - lastFocusUpdateRef.current >= FOCUS_UPDATE_INTERVAL) {
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
            setLandmarks(null);
            setCurrentEAR(null);
            latestEAR.current = null;
            // no face -> treat as 100% focus (or change if desired)
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