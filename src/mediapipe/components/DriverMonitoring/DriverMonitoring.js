import React, { useRef, useState, useContext } from 'react';
import Webcam from 'react-webcam';
import { useFaceMesh } from '../../hooks/useFaceMesh';
import { RecordingContext } from '../../../components/SessionRecording/SessionRecording';
import CanvasOverlay from "../CanvasOverlay";
import { useEarFocusProcessing } from './useEarFocusProcessing';

export default function DriverMonitoring() {
    const webcamRef = useRef(null);
    const [landmarks, setLandmarks] = useState(null);

    // Context actions
    const {
        setFocusPercent,
        setCurrentEAR,
        setFaceCount,
        setMonitorStatus
    } = useContext(RecordingContext);

    // EAR processing hook
    const { onResults } = useEarFocusProcessing(
        setLandmarks,
        setFocusPercent,
        setCurrentEAR,
        setFaceCount,
        setMonitorStatus
    );

    // MediaPipe FaceMesh hook
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