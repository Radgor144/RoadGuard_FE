import { useCallback } from "react";
import { toISO } from '../RecordingContext';

export const useRecordingActions = (
    state, // useRecordingTimers state
    actions, // useRecordingTimers actions
    alertActions, // useAlert actions
    wsData // useWebSocket data and actions
) => {
    const {
        isRecording, isTakingBreak, startTime, currentBreakStartRef, breaksList
    } = state;
    const {
        setIsRecording, setIsTakingBreak, setBreakTime, setStartTime, setLastBreakEndTime, setBreaksList, setElapsedTime
    } = actions;
    const { addAlert, resetSessionHistory } = alertActions;

    const { wsConnect, authToken, driverId } = wsData;

    const toggleRecording = useCallback(async () => {
        console.info('toggleRecording: invoked, isRecording=', isRecording);

        if (isRecording) {
            // Stop recording
            try {
                const token = authToken || localStorage.getItem('rg_token');
                console.debug('toggleRecording: token present=', !!token);

                const nowMs = Date.now();
                let finalBreaks = Array.isArray(breaksList) ? breaksList.slice() : [];

                // if currently taking a break, finalize that break
                if (isTakingBreak) {
                    const start = currentBreakStartRef.current;
                    if (start) {
                        console.info('toggleRecording: finalizing in-progress break, start=', start, 'end=', nowMs);
                        finalBreaks = [...finalBreaks, { start, end: nowMs }];
                        currentBreakStartRef.current = null;
                        setBreaksList(finalBreaks);
                    } else {
                        console.warn('toggleRecording: in-progress break had no start timestamp');
                    }
                }

                console.debug('toggleRecording: Final breaks to send:', finalBreaks);

                const payload = {
                    startTime: toISO(startTime),
                    endTime: toISO(nowMs),
                    breaks: finalBreaks.map(b => ({ startTime: toISO(b.start), endTime: toISO(b.end) })),
                };

                console.debug('toggleRecording: payload prepared', payload);

                const res = await fetch('http://localhost:8082/api/endTrip', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    const text = await res.text().catch(() => '');
                    console.warn('toggleRecording: endTrip POST failed', res.status, text);
                } else {
                    console.info('toggleRecording: endTrip POST successful');
                }
            } catch (e) {
                console.error('toggleRecording: Failed to POST endTrip', e);
            }

            console.info('toggleRecording: finishing stop flow, resetting state');

            // reset local session state
            setIsRecording(false);
            setIsTakingBreak(false);
            setBreakTime(0);
            currentBreakStartRef.current = null;
            setLastBreakEndTime(0);
            //setStartTime(0);
            setElapsedTime(0);
            setBreaksList([]);
            resetSessionHistory();

        } else {
            // Start recording
            console.info('toggleRecording: attempting to start recording, trying WS connect...');
            const connected = await (wsConnect ? wsConnect(5000) : Promise.resolve(false));
            console.info('toggleRecording: wsConnect result=', connected);
            if (!connected) {
                addAlert('Cannot start driving: real-time monitor unavailable (WebSocket connect failed)', 'warning', true);
                console.warn('toggleRecording: WebSocket connect failed; aborting start of recording');
                return;
            }

            setBreakTime(0); // Reset break timer
            setIsRecording(true);
            const now = Date.now();
            setStartTime(now);
            console.info('toggleRecording: session started, startTime=', now);
            setBreaksList([]);
            currentBreakStartRef.current = null;
            setLastBreakEndTime(now); // Reset time since last break (to start counting up)
        }
    }, [isRecording, isTakingBreak, breaksList, startTime, authToken, wsConnect, setBreaksList, setIsRecording, setIsTakingBreak, setBreakTime, setStartTime, setLastBreakEndTime, addAlert, currentBreakStartRef.current, resetSessionHistory, setElapsedTime]);


    const toggleBreak = useCallback(() => {
        if (!isRecording) {
            console.warn('toggleBreak: cannot toggle break, recording not active');
            return;
        }

        if (isTakingBreak) {
            // Ending break
            setIsTakingBreak(false);
            const end = Date.now();
            const start = currentBreakStartRef.current;
            if (start) {
                setBreaksList(prev => {
                    const next = [...prev, { start, end }];
                    console.info('toggleBreak: appended break', { start, end });
                    return next;
                });
                currentBreakStartRef.current = null;
                setLastBreakEndTime(end);
                console.info('toggleBreak: break ended at', end);
                addAlert('Break ended', 'info', true);
            } else {
                console.warn('toggleBreak: no start timestamp — not appending break');
            }
        } else {
            // Starting break
            setBreakTime(0);
            const start = Date.now();
            currentBreakStartRef.current = start;
            setIsTakingBreak(true);
            setLastBreakEndTime(0);
            console.info('toggleBreak: break started at', start);
            addAlert('Break started', 'info', true);
        }
    }, [isRecording, isTakingBreak, setBreakTime, setIsTakingBreak, setLastBreakEndTime, setBreaksList, addAlert, currentBreakStartRef.current]);

    return { toggleRecording, toggleBreak };
};