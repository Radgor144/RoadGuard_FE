import React from 'react';
import { getColorForType, TRANSITION_MS } from './AlertConstants';

const baseStyle = {transition: `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`};

const CornerAlert = ({ alertObj, position, closePopup }) => {
    const color = getColorForType(alertObj.type);
    const style = {
        position: 'fixed',
        top: position.top,
        right: position.right,
        zIndex: 2000 + position.zIndexOffset,
        minWidth: 320,
        maxWidth: 420,
        background: '#0b1220',
        color: '#fff',
        borderLeft: `4px solid ${color}`,
        padding: '10px 12px',
        borderRadius: 8,
        boxShadow: '0 6px 18px rgba(2,6,23,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        textAlign: 'left',
        opacity: 1,
        transform: 'translateY(0) scale(1)',
        ...baseStyle
    };

    return (
        <div key={alertObj.id} style={style}>
            <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                <div style={{fontWeight: 700, color: '#e6eef8', textAlign: 'left'}}>{alertObj.message}</div>
                <div style={{fontSize: 12, color: '#9aa6b2'}}>{new Date(alertObj.timestamp).toLocaleTimeString()}</div>
            </div>
            <div style={{marginLeft: 12}}>
                <button onClick={() => closePopup(alertObj.id)} style={{background: 'transparent', border: 'none', color: '#9aa6b2', cursor: 'pointer'}}>✕</button>
            </div>
        </div>
    );
};

export default CornerAlert;