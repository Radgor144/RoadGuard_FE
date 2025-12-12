import React, {useContext, useEffect, useState, useRef, useCallback} from 'react';
import {RecordingContext} from '../SessionRecording';
import { useAlertAudio } from './useAlertAudio';
import CornerAlert from './CornerAlert';
import CenterAlert from './CenterAlert';
import { AUTO_DISMISS_MS } from './AlertConstants';

const AlertsPopup = () => {
    const {alerts} = useContext(RecordingContext);
    const { playSound, stopLoop, startCriticalLoop, audioUnlocked } = useAlertAudio();

    const [hiddenIds, setHiddenIds] = useState(new Set());
    const hideTimers = useRef({});
    const prevCentralId = useRef(null);
    const initialAnchor = useRef({bottom: 20, rightOffset: 20});

    // Logika pozycjonowania
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

    // Efekt zarządzający auto-ukrywaniem i dźwiękiem
    useEffect(() => {
        if (!alerts || alerts.length === 0) {
            // clear timers and hidden state
            Object.values(hideTimers.current).forEach(tid => clearTimeout(tid));
            hideTimers.current = {};
            setHiddenIds(new Set());
            if (prevCentralId.current) stopLoop(prevCentralId.current); // Zatrzymaj pętlę, jeśli istnieje
            prevCentralId.current = null;
            return;
        }

        const latest = (alerts || []).slice(-10).reverse();

        // 1. Harmonogram auto-ukrywania
        latest.forEach(a => {
            if (a.type === 'critical') return;
            if (hideTimers.current[a.id]) return; // already scheduled
            // auto-hide after AUTO_DISMISS_MS
            hideTimers.current[a.id] = setTimeout(() => {
                setHiddenIds(s => new Set(Array.from(s).concat([a.id])));
                delete hideTimers.current[a.id];
            }, AUTO_DISMISS_MS);
        });

        // 2. Logika centralnego alertu i dźwięku
        const centralCandidates = latest.filter(p => p.type === 'critical' || p.type === 'warning' || p.type === 'alert');
        const criticals = centralCandidates.filter(c => c.type === 'critical');
        const central = (criticals.length > 0 ? criticals[0] : centralCandidates[0]) || null;

        // start/stop critical loop if central changed
        if (prevCentralId.current !== (central ? central.id : null)) {
            // stop previous
            if (prevCentralId.current) stopLoop(prevCentralId.current);
            // start new if critical
            if (central && central.type === 'critical') {
                if (audioUnlocked) startCriticalLoop(central.id);
            } else if (central && central.type && central.type !== 'critical') {
                // play one-shot for warnings/alerts
                if (audioUnlocked) playSound('warning');
            }
            prevCentralId.current = central ? central.id : null;
        }
    }, [alerts, playSound, startCriticalLoop, stopLoop, audioUnlocked]);

    // compute which alerts to render (last 10, newest first), excluding hidden
    const visibleAlerts = (alerts || []).slice(-10).reverse().filter(a => !hiddenIds.has(a.id));

    if (!visibleAlerts || visibleAlerts.length === 0) return null;

    // Logika podziału na Corner/Center
    const infoPopups = visibleAlerts.filter(p => p.type === 'info');
    const centerPopups = visibleAlerts.filter(p => p.type === 'warning' || p.type === 'critical' || p.type === 'alert');
    // If there is an active critical popup, show warnings/alerts in the corner (so critical remains central but warnings are still visible)
    const criticals = centerPopups.filter(c => c.type === 'critical');
    const nonCriticalCenter = centerPopups.filter(c => c.type !== 'critical');
    const effectiveInfoPopups = criticals.length > 0 ? [...infoPopups, ...nonCriticalCenter] : infoPopups;
    const effectiveCenterPopups = criticals.length > 0 ? criticals : centerPopups;

    const central = effectiveCenterPopups[0] || null;

    // Stałe do pozycjonowania w rogu
    const ITEM_HEIGHT = 72;
    const GAP = 10;
    const baseTop = initialAnchor.current.bottom || 20;
    const baseRight = initialAnchor.current.rightOffset || 20;

    // Renderowanie
    return (
        <>
            {/* Corner container for informational alerts */}
            {effectiveInfoPopups.length > 0 && (
                effectiveInfoPopups.map((alertObj, idx) => {
                    const top = baseTop + idx * (ITEM_HEIGHT + GAP);
                    return (
                        <CornerAlert
                            key={alertObj.id}
                            alertObj={alertObj}
                            closePopup={closePopup}
                            position={{ top, right: baseRight, zIndexOffset: effectiveInfoPopups.length - idx }}
                        />
                    );
                })
            )}

            {/* Centered popups (warning/critical) */}
            {central && <CenterAlert alertObj={central} closePopup={closePopup} />}
        </>
    );
}

export default AlertsPopup;