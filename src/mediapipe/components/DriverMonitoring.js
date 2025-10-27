import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { calculateEAR } from '../utils/calculateEAR';
import { useFaceMesh } from '../hooks/useFaceMesh';
import CanvasOverlay from './CanvasOverlay';
import StatusDisplay from './StatusDisplay';

export default function DriverMonitoring() {
    const webcamRef = useRef(null);
    const [status, setStatus] = useState('idle');
    const [faceCount, setFaceCount] = useState(0);
    const [currentEAR, setCurrentEAR] = useState(null);
    const [landmarks, setLandmarks] = useState(null);
    const EAR_THRESHOLD = 0.2;

    const onResults = useCallback((results) => {
        if (!results.image) return;
        const faces = results.multiFaceLandmarks || [];
        setFaceCount(faces.length);
        setStatus(faces.length === 0 ? 'no faces detected' : `faces detected: ${faces.length}`);

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
            setCurrentEAR(Number(avgEAR.toFixed(3)));

            if (avgEAR < EAR_THRESHOLD) {
                console.log('Eyes closed! EAR=', avgEAR);
            }
        } else {
            setLandmarks(null);
            setCurrentEAR(null);
        }
    }, []);

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