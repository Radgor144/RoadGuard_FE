import React from 'react';

export default function StatusDisplay({ status, faceCount, currentEAR }) {
    return (
        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 20, color: 'white', background: 'rgba(0,0,0,0.4)', padding: 6, borderRadius: 4, fontSize: 14 }}>
            <div>Status: {status}</div>
            <div>Faces: {faceCount}</div>
            <div>EAR: {currentEAR ?? '-'}</div>
        </div>
    );
}
