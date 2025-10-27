import React, { useEffect, useRef } from 'react';

export default function CanvasOverlay({ videoWidth, videoHeight, landmarks }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || !landmarks) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = videoWidth;
        canvas.height = videoHeight;

        ctx.clearRect(0, 0, videoWidth, videoHeight);
        ctx.save();
        ctx.translate(videoWidth, 0);
        ctx.scale(-1, 1);

        const leftEyeIndices = [
            33,  7, 163, 144, 145, 153, 154, 155, 133, 246,
            161, 160, 159, 158, 157, 173, 133
        ];

        const rightEyeIndices = [
            362, 382, 381, 380, 374, 373, 390, 249, 263, 466,
            388, 387, 386, 385, 384, 398, 263
        ];

        [...leftEyeIndices, ...rightEyeIndices].forEach(i => {
            const p = landmarks[i];
            if (!p) return;
            ctx.beginPath();
            ctx.fillStyle = 'cyan';
            ctx.arc(p.x * videoWidth, p.y * videoHeight, 2, 0, 2 * Math.PI);
            ctx.fill();
        });

        ctx.restore();
    }, [landmarks, videoWidth, videoHeight]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                width: videoWidth,
                height: videoHeight,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                objectFit: 'cover',
                zIndex: 2,
                pointerEvents: 'none',
            }}
        />
    );
}