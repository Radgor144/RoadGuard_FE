import React, {useContext, useEffect, useState, useRef} from 'react';
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

const AlertsPopup = () => {
        const {alerts} = useContext(RecordingContext);

        // Single MP3 file used for both warning and critical (place in public/sounds/alertSound.mp3)
        const AUDIO_FILES = {
            warning: '/sounds/alertSound.mp3',
            critical: '/sounds/alertSound.mp3'
        };
        const audioEls = useRef({});
        // Track looping audio (by popup id) for MP3 elements (we store the actual Audio instance used for the loop)
        const audioLoopRefs = useRef({});
        // Preload Audio base elements (we'll clone for one-shots)
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
            return () => {
                Object.values(audioEls.current).forEach(a => { if (a && typeof a.pause === 'function') try { a.pause(); } catch (e) {} });
                audioEls.current = {};
            };
        }, []);

        const playSound = (type) => {
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
        };

        // Audio loop management for critical alerts: create dedicated Audio element per loop (or fallback to warning file with modified playbackRate)
        const startCriticalLoop = (id) => {
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
        };

        const stopLoop = (id) => {
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
        };

        // popups: { id, alert, visible: bool, closing: bool }
        const [popups, setPopups] = useState([]);
        // timers per id: { dismiss: timeoutId, remove: timeoutId }
        const timers = useRef({});
        const lastProcessed = useRef(0); // timestamp ms of last processed alert

        // Initialize lastProcessed to the last existing alert timestamp on mount
        const initialAnchor = useRef({bottom: 20, rightOffset: 20});
        useEffect(() => {
            if (alerts && alerts.length > 0) {
                lastProcessed.current = alerts[alerts.length - 1].timestamp || Date.now();
            } else {
                lastProcessed.current = Date.now();
            }

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
            return () => {
                window.removeEventListener('resize', computeAnchor);
                window.removeEventListener('scroll', computeAnchor);
            };
            // run only once on mount
        }, []);

        // When new alerts are appended to context.alerts, add only NEW alerts to local popups queue
        useEffect(() => {
            if (!alerts || alerts.length === 0) return;
            // find alerts with timestamp > lastProcessed
            const newAlerts = alerts.filter(a => (a.timestamp || 0) > (lastProcessed.current || 0));
            if (newAlerts.length === 0) return;
            setPopups(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                // create popup objects with visible=false initially
                const toAdd = newAlerts.filter(a => !existingIds.has(a.id)).map(a => ({
                    id: a.id,
                    alert: a,
                    visible: false,
                    closing: false
                }));
                if (toAdd.length === 0) return prev;
                // prepend so newest alerts appear closest to the anchor (index 0)
                return [...toAdd, ...prev];
            });
            // update lastProcessed to newest timestamp we've seen
            lastProcessed.current = newAlerts[newAlerts.length - 1].timestamp || lastProcessed.current;
        }, [alerts]);

        // Trigger enter animation: set visible=true for newly added popups (next tick)
        useEffect(() => {
            if (popups.length === 0) return;
            const idsToShow = popups.filter(p => !p.visible && !p.closing).map(p => p.id);
            if (idsToShow.length === 0) return;
            // capture types to play sounds for those ids
            const newPopups = popups.filter(p => idsToShow.includes(p.id));
            // Determine which central popup will actually be displayed after this update
            const centralCandidates = popups.filter(p => p.alert.type === 'critical' || p.alert.type === 'warning' || p.alert.type === 'alert');
            const criticals = centralCandidates.filter(c => c.alert.type === 'critical');
            const centralDisplayedId = (criticals.length > 0 ? criticals[0] : centralCandidates[0])?.id;

            const t = setTimeout(() => {
                setPopups(prev => prev.map(p => idsToShow.includes(p.id) ? { ...p, visible: true } : p));
                // play sounds / start loops only for popups that will be visible
                newPopups.forEach(np => {
                    const tp = np.alert.type;
                    if (tp === 'info') {
                        // info are shown in corner
                        playSound('warning');
                    } else if (tp === 'critical' || tp === 'warning' || tp === 'alert') {
                        // only play when this popup is the one actually displayed centrally
                        if (np.id === centralDisplayedId) {
                            if (tp === 'critical') {
                                startCriticalLoop(np.id);
                            } else {
                                playSound('warning');
                            }
                        }
                    }
                });
            }, 20);
            return () => clearTimeout(t);
        }, [popups]);

        // Manage timeouts for auto-dismissable popups
        useEffect(() => {
            popups.forEach(p => {
                const type = p.alert.type;
                if (type === 'critical') return; // manual close only
                // if already scheduled to dismiss or remove, skip
                if (timers.current[p.id] && (timers.current[p.id].dismiss || timers.current[p.id].remove)) return;
                // schedule dismiss -> set closing flag to trigger animation, then remove after TRANSITION_MS
                const dismissId = setTimeout(() => {
                    setPopups(current => current.map(x => x.id === p.id ? { ...x, closing: true } : x));
                    // stop any looping sound immediately when closing starts
                    stopLoop(p.id);
                    // schedule actual removal after transition
                    const removeId = setTimeout(() => {
                        setPopups(current => current.filter(x => x.id !== p.id));
                        // after DOM updates, ensure remaining popups are marked visible so they animate into place
                        setTimeout(() => setPopups(curr => curr.map(q => ({ ...q, visible: true }))), 30);
                        if (timers.current[p.id]) delete timers.current[p.id];
                    }, TRANSITION_MS);
                    timers.current[p.id] = { ...timers.current[p.id], remove: removeId };
                }, AUTO_DISMISS_MS);
                timers.current[p.id] = { ...(timers.current[p.id] || {}), dismiss: dismissId };
            });

            // cleanup on unmount
            return () => {
                Object.values(timers.current).forEach(obj => {
                    if (!obj) return;
                    if (obj.dismiss) clearTimeout(obj.dismiss);
                    if (obj.remove) clearTimeout(obj.remove);
                });
                timers.current = {};
            };
        }, [popups]);

        const closePopup = (id) => {
            // if there's a dismiss/remove scheduled, clear them
            const t = timers.current[id];
            if (t) {
                if (t.dismiss) clearTimeout(t.dismiss);
                if (t.remove) clearTimeout(t.remove);
                delete timers.current[id];
            }
            // trigger closing animation first
            setPopups(prev => prev.map(p => p.id === id ? { ...p, closing: true } : p));
            // stop looping sound immediately
            stopLoop(id);
            // remove after transition and recompute position
            setTimeout(() => {
                setPopups(prev => prev.filter(p => p.id !== id));
                // ensure remaining popups animate to new positions
                setTimeout(() => setPopups(curr => curr.map(q => ({ ...q, visible: true }))), 30);
            }, TRANSITION_MS);
        }

        if (!popups || popups.length === 0) return null;

        // split popups by placement
        const infoPopups = popups.filter(p => p.alert.type === 'info');
        const centerPopups = popups.filter(p => p.alert.type === 'warning' || p.alert.type === 'critical' || p.alert.type === 'alert');

        // helper for style
        const baseStyle = {transition: `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`};

        return (
            <>
                {/* Corner container for informational alerts */}
                {infoPopups.length > 0 && (
                    <>
                        {(() => {
                            const ITEM_HEIGHT = 72; // px per info popup (approx)
                            const GAP = 10;
                            // compute base position from stable initialAnchor
                            const baseTop = initialAnchor.current.bottom || 20;
                            const baseRight = initialAnchor.current.rightOffset || 20;
                            return infoPopups.map((p, idx) => {
                                const {alert, visible, closing} = p;
                                const color = getColorForType(alert.type);
                                // idx 0 is newest (we prepended) so position newest closest to baseTop
                                const top = baseTop + idx * (ITEM_HEIGHT + GAP);
                                const style = {
                                    position: 'fixed',
                                    top: top,
                                    right: baseRight,
                                    zIndex: 2000 + (infoPopups.length - idx),
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
                                    opacity: closing ? 0 : (visible ? 1 : 0),
                                    transform: closing ? 'translateY(-6px) scale(0.995)' : (visible ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(0.995)'),
                                    ...baseStyle
                                };
                                return (
                                    <div key={p.id} style={style}>
                                        <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                                            <div style={{
                                                fontWeight: 700,
                                                color: '#e6eef8',
                                                textAlign: 'left'
                                            }}>{alert.message}</div>
                                            <div style={{
                                                fontSize: 12,
                                                color: '#9aa6b2'
                                            }}>{new Date(alert.timestamp).toLocaleTimeString()}</div>
                                        </div>
                                        <div style={{marginLeft: 12}}>
                                            <button onClick={() => closePopup(p.id)} style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#9aa6b2',
                                                cursor: 'pointer'
                                            }}>✕
                                            </button>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </>
                )}

                {/* Centered popups (warning/critical) positioned individually to avoid container reflow */}
                {centerPopups.length > 0 && (() => {
                    // If there's any critical central alert, show the newest critical first (override warnings)
                    const criticals = centerPopups.filter(c => c.alert.type === 'critical');
                    const p = criticals.length > 0 ? criticals[0] : centerPopups[0];
                    const {alert, visible, closing} = p;
                    const color = getColorForType(alert.type);
                    const isCritical = alert.type === 'critical';
                    const ITEM_HEIGHT_CENTER = 96;
                    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
                    const centerY = Math.round(viewportHeight / 2);
                    const top = centerY - Math.round(ITEM_HEIGHT_CENTER / 2);
                    const z = isCritical ? 5000 : 4000; // critical gets higher z-index to override
                    const style = {
                        position: 'fixed',
                        top: top,
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
                        opacity: closing ? 0 : (visible ? 1 : 0),
                        transform: closing ? 'translate(-50%, -8px) scale(0.995)' : 'translate(-50%, 0) scale(1)',
                        ...baseStyle
                    };
                    return (
                        <div key={p.id} style={style}>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                                textAlign: 'center',
                                flex: 1
                            }}>
                                <div style={{fontWeight: 800, color: '#ffffff', fontSize: 18}}>{alert.message}</div>
                                <div style={{
                                    fontSize: 13,
                                    color: '#9aa6b2'
                                }}>{new Date(alert.timestamp).toLocaleTimeString()}</div>
                            </div>
                            <div style={{marginLeft: 12, display: 'flex', alignItems: 'center'}}>
                                {!isCritical && (
                                    <button onClick={() => closePopup(p.id)} style={{
                                        background: 'transparent',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        padding: '8px 10px',
                                        borderRadius: 6
                                    }}>Close</button>
                                )}
                                {isCritical && (
                                    <button onClick={() => closePopup(p.id)} style={{
                                        background: color,
                                        border: 'none',
                                        color: '#0b1220',
                                        padding: '10px 14px',
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        fontWeight: 800
                                    }}>Dismiss</button>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </>
        );
    }
;

export default AlertsPopup;

