import React from 'react';
import { getColorForType, TRANSITION_MS } from './AlertConstants';

const baseStyle = {transition: `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`};

const CenterAlert = ({ alertObj, closePopup }) => {
    const color = getColorForType(alertObj.type);
    const isCritical = alertObj.type === 'critical';
    const ITEM_HEIGHT_CENTER = 96;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const centerY = Math.round(viewportHeight / 2);
    const top = centerY - Math.round(ITEM_HEIGHT_CENTER / 2);
    const z = isCritical ? 5000 : 4000;

    const style = {
        position: 'fixed',
        top,
        left: '50%',
        zIndex: z,
        minWidth: 420,
        maxWidth: 720,
        background: '#07101a',
        color: '#fff',
        borderLeft: `6px solid ${color}`,
        padding: '16px 18px',
        borderRadius: 10,
        boxShadow: '0 12px 36px rgba(2,6,23,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        transform: 'translate(-50%, 0) scale(1)',
        ...baseStyle
    };

    return (
        <div key={alertObj.id} style={style}>
            <div style={{display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'center', flex: 1}}>
                <div style={{fontWeight: 800, color: '#ffffff', fontSize: 18}}>{alertObj.message}</div>
                <div style={{fontSize: 13, color: '#9aa6b2'}}>{new Date(alertObj.timestamp).toLocaleTimeString()}</div>
            </div>
            <div style={{marginLeft: 12, display: 'flex', alignItems: 'center'}}>
                {!isCritical && (
                    <button onClick={() => closePopup(alertObj.id)} style={{background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', padding: '8px 10px', borderRadius: 6}}>Close</button>
                )}
                {isCritical && (
                    <button onClick={() => closePopup(alertObj.id)} style={{background: color, border: 'none', color: '#0b1220', padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 800}}>Dismiss</button>
                )}
            </div>
        </div>
    );
};

export default CenterAlert;