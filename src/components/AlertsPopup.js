import React, {useContext, useEffect, useState, useRef, useCallback} from 'react';
import {RecordingContext} from './SessionRecording';

// Simple pop-up/toast system based on alert entries from RecordingContext.
// - Critical alerts (type === 'critical') require manual close.
// - Other alerts auto-dismiss after AUTO_DISMISS_MS.

const AUTO_DISMISS_MS = 5000; // auto-dismiss non-critical after 5s
const TRANSITION_MS = 300; // animation duration in ms

const getColorForType = (type) => {
    switch (type) {
        case 'info':
            return '#60a5fa';
        case 'warning':
            return '#f59e0b';
        case 'critical':
            return '#ef4444';
        case 'alert':
            return '#f97316';
        default:
            return '#94a3b8';
    }
}

// Single MP3 file used for both warning and critical (place in public/sounds/alertSound.mp3)
// (moved to module scope for stable identity)
const AUDIO_FILES = {
    warning: '/sounds/alertSound.mp3',
    critical: '/sounds/alertSound.mp3'
};

const AlertsPopup = () => {
        const {alerts} = useContext(RecordingContext);

        const audioEls = useRef({});
        // Track looping audio (by popup id) for MP3 elements (we store the actual Audio instance used for the loop)
        const audioLoopRefs = useRef({});
        // track whether we've unlocked audio playback (some browsers block autoplay until user gesture)
        const audioUnlocked = useRef(false);
        const unlockAudio = useCallback(() => {
            if (audioUnlocked.current) return;
            try {
                Object.values(audioEls.current).forEach(base => {
                    if (!base) return;
                    const p = base.cloneNode(true);
                    p.muted = true;
                    p.play().then(() => { p.pause(); p.currentTime = 0; }).catch(() => {});
                });
                audioUnlocked.current = true;
                window.removeEventListener('click', unlockAudio);
                window.removeEventListener('keydown', unlockAudio);
            } catch (e) {
                // ignore
            }
        }, []);

        // Preload audio once; include AUDIO_FILES properties and unlockAudio in deps so static checker is satisfied
        useEffect(() => {
            Object.keys(AUDIO_FILES).forEach(key => {
                try {
                    const a = new Audio(AUDIO_FILES[key]);
                    a.preload = 'auto';
                    // do not set loop here; clones or dedicated loops will control it
                    audioEls.current[key] = a;
                } catch (e) {
                    audioEls.current[key] = null;
                }
            });
            // try to unlock audio on first user gesture
            window.addEventListener('click', unlockAudio);
            window.addEventListener('keydown', unlockAudio);
            // also allow programmatic attempts to unlock (e.g., when starting recording or test buttons)
            window.addEventListener('rg:attemptAudioUnlock', unlockAudio);
            return () => {
                Object.values(audioEls.current).forEach(a => { if (a && typeof a.pause === 'function') try { a.pause(); } catch (e) {} });
                audioEls.current = {};
                window.removeEventListener('click', unlockAudio);
                window.removeEventListener('keydown', unlockAudio);
                window.removeEventListener('rg:attemptAudioUnlock', unlockAudio);
            };
        }, [unlockAudio, AUDIO_FILES.warning, AUDIO_FILES.critical]);

        const playSound = useCallback((type) => {
            // Create a cloned audio element for one-shot playback so it doesn't interfere with looped element
            const base = audioEls.current[type];
            if (!base) return;
            try {
                const a = base.cloneNode(true);
                a.preload = 'auto';
                // play and cleanup after ended
                const cleanup = () => { try { a.pause(); a.src = ''; } catch (e) {} };
                a.addEventListener('ended', cleanup);
                a.play().catch(() => { /* autoplay blocked or error */ });
                // safety cleanup after 8s in case 'ended' doesn't fire
                setTimeout(cleanup, 8000);
            } catch (e) {
                // ignore playback errors
            }
        }, []);

        // Audio loop management for critical alerts: create dedicated Audio element per loop (or fallback to warning file with modified playbackRate)
        const stopLoop = useCallback((id) => {
            const h = audioLoopRefs.current[id];
            if (!h) return;
            try {
                if (h.el) {
                    h.el.loop = false;
                    h.el.pause();
                    h.el.currentTime = 0;
                    try { h.el.src = ''; } catch (e) {}
                } else if (Array.isArray(h.els)) {
                    // stop all elements in the array
                    h.els.forEach(el => {
                        if (el) {
                            el.loop = false;
                            el.pause();
                            el.currentTime = 0;
                            try { el.src = ''; } catch (e) {}
                        }
                    });
                }
            } catch (e) {}
            delete audioLoopRefs.current[id];
        }, []);

        const startCriticalLoop = useCallback((id) => {
             if (audioLoopRefs.current[id]) return;
             // stop any other loops to ensure only one critical loop plays at a time
             Object.keys(audioLoopRefs.current).forEach(k => {
                 try { stopLoop(k); } catch (e) {}
             });
             // prefer dedicated critical file
             let src = AUDIO_FILES.critical;
             let el = null;
             try {
                 el = new Audio(src);
                 el.preload = 'auto';
                 el.loop = true;
                 el.play().catch(() => {});
                 audioLoopRefs.current[id] = { el };
                 return;
             } catch (e) {
                 // failed to create critical audio, will try fallback below
             }
             // fallback: if warning file exists, create a small 'chorus' using two clones with different playbackRate
             try {
                 const warningBase = audioEls.current.warning;
                 if (warningBase) {
                     const a1 = warningBase.cloneNode(true);
                     const a2 = warningBase.cloneNode(true);
                     a1.preload = 'auto'; a2.preload = 'auto';
                     a1.loop = true; a2.loop = true;
                     a1.playbackRate = 0.82; a2.playbackRate = 0.88;
                     a1.volume = 0.95; a2.volume = 0.85;
                     a1.play().catch(() => {});
                     a2.play().catch(() => {});
                     console.warn('[AlertsPopup] critical file missing - using two warning clones as fallback with varied playbackRate');
                     audioLoopRefs.current[id] = { els: [a1, a2] };
                 }
             } catch (e) {
                 // give up if everything fails
             }
        }, [stopLoop]);

        // Simplified popup rendering strategy:
        // - derive visible alerts from provider (last 10)
        // - track hidden ids locally when user closes popups
        // - auto-hide non-critical alerts after AUTO_DISMISS_MS
        const [hiddenIds, setHiddenIds] = useState(new Set());
        const hideTimers = useRef({});
        const prevCentralId = useRef(null);
        const initialAnchor = useRef({bottom: 20, rightOffset: 20});

        useEffect(() => {
            const computeAnchor = () => {
                try {
                    const el = document.querySelector('.top-right-auth');
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        initialAnchor.current.bottom = Math.round(rect.bottom || 20);
                        initialAnchor.current.rightOffset = Math.round(Math.max(8, window.innerWidth - rect.right + 8));
                    } else {
                        initialAnchor.current.bottom = 20;
                        initialAnchor.current.rightOffset = 20;
                    }
                } catch (e) {
                    initialAnchor.current.bottom = 20;
                    initialAnchor.current.rightOffset = 20;
                }
            };
            computeAnchor();
            window.addEventListener('resize', computeAnchor);
            window.addEventListener('scroll', computeAnchor);
            return () => { window.removeEventListener('resize', computeAnchor); window.removeEventListener('scroll', computeAnchor); };
        }, []);

        // compute which alerts to render (last 10, newest first), excluding hidden
        const visibleAlerts = (alerts || []).slice(-10).reverse().filter(a => !hiddenIds.has(a.id));

        // when alerts change, schedule auto-hide timers for non-critical items and trigger audio/loops
        useEffect(() => {
            if (!alerts || alerts.length === 0) {
                // clear timers and hidden state
                Object.values(hideTimers.current).forEach(tid => clearTimeout(tid));
                hideTimers.current = {};
                setHiddenIds(new Set());
                prevCentralId.current = null;
                return;
            }

            const latest = (alerts || []).slice(-10).reverse();

            // schedule auto-hide for non-critical alerts
            latest.forEach(a => {
                if (a.type === 'critical') return;
                if (hideTimers.current[a.id]) return; // already scheduled
                // auto-hide after AUTO_DISMISS_MS
                hideTimers.current[a.id] = setTimeout(() => {
                    setHiddenIds(s => new Set(Array.from(s).concat([a.id])));
                    delete hideTimers.current[a.id];
                }, AUTO_DISMISS_MS);
            });

            // determine central alert (critical preferred)
            const centralCandidates = latest.filter(p => p.type === 'critical' || p.type === 'warning' || p.type === 'alert');
            const criticals = centralCandidates.filter(c => c.type === 'critical');
            const central = (criticals.length > 0 ? criticals[0] : centralCandidates[0]) || null;

            // start/stop critical loop if central changed
            if (prevCentralId.current !== (central ? central.id : null)) {
                // stop previous
                if (prevCentralId.current) stopLoop(prevCentralId.current);
                // start new if critical
                if (central && central.type === 'critical') {
                    if (audioUnlocked.current) startCriticalLoop(central.id);
                } else if (central && central.type && central.type !== 'critical') {
                    // play one-shot for warnings/alerts
                    if (audioUnlocked.current) playSound('warning');
                }
                prevCentralId.current = central ? central.id : null;
            }
        }, [alerts, playSound, startCriticalLoop, stopLoop]);

        const closePopup = (id) => {
            // hide locally and clear any scheduled hide
            setHiddenIds(s => new Set(Array.from(s).concat([id])));
            if (hideTimers.current[id]) {
                clearTimeout(hideTimers.current[id]);
                delete hideTimers.current[id];
            }
            // ensure critical loop stops if closing the central critical
            stopLoop(id);
        }

        if (!visibleAlerts || visibleAlerts.length === 0) return null;

        // split popups by placement
        const infoPopups = visibleAlerts.filter(p => p.type === 'info');
        const centerPopups = visibleAlerts.filter(p => p.type === 'warning' || p.type === 'critical' || p.type === 'alert');
        // If there is an active critical popup, show warnings/alerts in the corner (so critical remains central but warnings are still visible)
        const criticals = centerPopups.filter(c => c.type === 'critical');
        const nonCriticalCenter = centerPopups.filter(c => c.type !== 'critical');
        const effectiveInfoPopups = criticals.length > 0 ? [...infoPopups, ...nonCriticalCenter] : infoPopups;
        const effectiveCenterPopups = criticals.length > 0 ? criticals : centerPopups;

        // helper for style
        const baseStyle = {transition: `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`};

        // compute central once to simplify JSX
        const central = effectiveCenterPopups[0] || null;

        // Render
        return (
            <>
                {/* Corner container for informational alerts */}
                {effectiveInfoPopups.length > 0 && (
                    effectiveInfoPopups.map((alertObj, idx) => {
                        const ITEM_HEIGHT = 72;
                        const GAP = 10;
                        const baseTop = initialAnchor.current.bottom || 20;
                        const baseRight = initialAnchor.current.rightOffset || 20;
                        const top = baseTop + idx * (ITEM_HEIGHT + GAP);
                        const color = getColorForType(alertObj.type);
                        const style = {
                            position: 'fixed',
                            top,
                            right: baseRight,
                            zIndex: 2000 + (effectiveInfoPopups.length - idx),
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
                    })
                )}

                {/* Centered popups (warning/critical) */}
                {central && (() => {
                    const alertObj = central;
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
                })()}
            </>
        );
    }

export default AlertsPopup;

