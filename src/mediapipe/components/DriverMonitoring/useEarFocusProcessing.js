import { useCallback, useRef } from 'react';
import { calculateEAR } from '../../utils/calculateEAR';
import {
    mapEarToFocusPercent,
    FOCUS_UPDATE_INTERVAL,
    TOP_N_SAMPLES
} from './EarToPercent';

export const useEarFocusProcessing = (
    setLandmarks,
    setContextFocusPercent,
    setContextCurrentEAR,
    setContextFaceCount,
    setContextMonitorStatus
) => {
    // accumulator for EAR samples within the period
    const earSamplesRef = useRef([]);

    const latestEAR = useRef(null);

    const lastFocusUpdateRef = useRef(0);
    const lastFocusAlertRef = useRef(false);

    const onResults = useCallback((results) => {
        if (!results.image) return;
        const faces = results.multiFaceLandmarks || [];

        const now = Date.now();

        // face detection logic
        setContextFaceCount && setContextFaceCount(faces.length);
        setContextMonitorStatus && setContextMonitorStatus(faces.length === 0 ? 'no face detected' : 'face detected');

        if (faces.length > 0) {
            const landmarks = faces[0];
            setLandmarks(landmarks);

            // eye landmark indices from MediaPipe Face Mesh
            const leftEyeIndices = [362, 380, 374, 263, 386, 385];
            const rightEyeIndices = [33, 159, 158, 133, 153, 145];

            const leftEye = leftEyeIndices.map(i => landmarks[i]);
            const rightEye = rightEyeIndices.map(i => landmarks[i]);

            const leftEAR = calculateEAR(leftEye);
            const rightEAR = calculateEAR(rightEye);

            const rawAvgEar = (leftEAR + rightEAR) / 2;

            // sample gathering
            if (typeof rawAvgEar === 'number' && !isNaN(rawAvgEar)) {
                earSamplesRef.current.push(rawAvgEar);
            }

            // global context update for current EAR
            const rounded = Number(rawAvgEar.toFixed(3));
            setContextCurrentEAR && setContextCurrentEAR(rounded);
            latestEAR.current = rawAvgEar;

            // computing and updating Focus Percent at intervals
            if (now - lastFocusUpdateRef.current >= FOCUS_UPDATE_INTERVAL) {
                const samplesArray = earSamplesRef.current;
                let avgEarForPeriod = null;

                if (samplesArray.length > 0) {
                    // count top N samples and average them to avoid blinks/noise
                    const topSamples = samplesArray.slice()
                        .sort((a, b) => b - a)
                        .slice(0, TOP_N_SAMPLES);

                    const sumTop = topSamples.reduce((s, v) => s + v, 0);
                    avgEarForPeriod = sumTop / topSamples.length;
                }

                // sample reset for next period
                earSamplesRef.current = [];

                // focus percent mapping
                const focusPercentComputed = (avgEarForPeriod === null)
                    ? 100
                    : mapEarToFocusPercent(avgEarForPeriod);

                setContextFocusPercent && setContextFocusPercent(focusPercentComputed);
                lastFocusUpdateRef.current = now;

                // alert flag reset
                if (focusPercentComputed < 50 && !lastFocusAlertRef.current) {
                    lastFocusAlertRef.current = true;
                } else if (focusPercentComputed >= 50) {
                    lastFocusAlertRef.current = false;
                }
            }
        } else {
            // state reset when no face is detected
            setLandmarks(null);
            setContextCurrentEAR && setContextCurrentEAR(null);

            // force focus percent to 100%
            earSamplesRef.current = [];
            setContextFocusPercent && setContextFocusPercent(100);

            lastFocusUpdateRef.current = now;
            lastFocusAlertRef.current = false;
        }
    }, [
        setLandmarks,
        setContextFocusPercent,
        setContextCurrentEAR,
        setContextFaceCount,
        setContextMonitorStatus
    ]);

    return { onResults, latestEAR };
};