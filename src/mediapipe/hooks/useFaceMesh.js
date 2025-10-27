import { useState, useEffect, useRef, useCallback } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

export function useFaceMesh(webcamRef, onResults) {
    const cameraRef = useRef(null);
    const faceMeshRef = useRef(null);
    const [status, setStatus] = useState('idle');
    const [isLoading, setIsLoading] = useState(true);

    const waitForVideoReady = (video, timeout = 3000) =>
        new Promise((resolve) => {
            const start = performance.now();
            const check = () => {
                if (!video) return resolve(false);
                if (video.readyState >= 2 && video.videoWidth && video.videoHeight) return resolve(true);
                if (performance.now() - start > timeout) return resolve(false);
                requestAnimationFrame(check);
            };
            check();
        });

    const startFaceMesh = useCallback(async () => {
        if (!webcamRef.current?.video) {
            setStatus('webcam not ready');
            return;
        }
        if (faceMeshRef.current) return;

        setIsLoading(true);
        setStatus('creating FaceMesh');

        faceMeshRef.current = new FaceMesh({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`,
        });

        faceMeshRef.current.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        faceMeshRef.current.onResults(onResults);

        setStatus('FaceMesh created');

        const videoReady = await waitForVideoReady(webcamRef.current.video, 4000);
        if (!videoReady) console.warn('Video did not become ready in time');

        cameraRef.current = new Camera(webcamRef.current.video, {
            onFrame: async () => {
                if (faceMeshRef.current && webcamRef.current?.video) {
                    try {
                        await faceMeshRef.current.send({ image: webcamRef.current.video });
                    } catch (err) {
                        console.error('FaceMesh send error:', err);
                        setStatus('send error');
                    }
                }
            },
            width: 640,
            height: 480,
        });

        try {
            await cameraRef.current.start();
            setStatus('Camera started');
            setIsLoading(false);
        } catch (err) {
            console.error('Error starting camera:', err);
            setStatus('camera start error');
            setIsLoading(false);
        }
    }, [webcamRef, onResults]);

    useEffect(() => {
        return () => {
            cameraRef.current?.stop();
            faceMeshRef.current?.close();
        };
    }, []);

    return { startFaceMesh, status, isLoading };
}