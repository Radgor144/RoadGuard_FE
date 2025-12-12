import { useEffect, useRef, useCallback } from 'react';
import { AUDIO_FILES } from './AlertConstants';

const ALERT_URL = AUDIO_FILES.warning;

export const useAlertAudio = () => {
    const audioCtxRef = useRef(null);
    const unlockedRef = useRef(false);
    const bufferRef = useRef(null);
    const loopSourcesRef = useRef({});

    const createContext = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new window.AudioContext();
        }
        return audioCtxRef.current;
    }, []);

    const loadSound = useCallback(async () => {
        if (bufferRef.current) return bufferRef.current;
        const ctx = createContext();
        try {
            const res = await fetch(ALERT_URL);
            const arrayBuffer = await res.arrayBuffer();
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
            bufferRef.current = audioBuffer;
            return audioBuffer;
        } catch (err) {
            console.warn(`useAlertAudio: loadSound error for ${ALERT_URL}`, err);
            return null;
        }
    }, [createContext]);

    const unlockAudio = useCallback(async () => {
        if (unlockedRef.current) return true;
        const ctx = createContext();
        try {
            if (ctx.state === 'suspended') {
                await ctx.resume();
            }
            unlockedRef.current = true;
            return true;
        } catch (err) {
            console.warn('useAlertAudio: unlockAudio failed', err);
            return false;
        }
    }, [createContext]);

    // Single play
    const playSound = useCallback(async (type) => {
        const buffer = await loadSound();
        const ok = await unlockAudio();

        if (!ok || !buffer) return;

        const ctx = audioCtxRef.current;
        try {
            const src = ctx.createBufferSource();
            src.buffer = buffer;
            src.connect(ctx.destination);
            src.start(0);

            // stop after 8s to avoid leaks
            setTimeout(() => {
                try { src.stop(); } catch (e) {}
            }, 8000);

        } catch (err) {
            console.warn('useAlertAudio: play error', err);
        }
    }, [loadSound, unlockAudio]);

    const stopLoop = useCallback((id) => {
        const src = loopSourcesRef.current[id];
        if (src) {
            try {
                src.stop();
                src.disconnect();
            } catch (e) {
                console.warn('useAlertAudio: stopLoop failed', e);
            }
            delete loopSourcesRef.current[id];
        }
    }, []);

    // Loop start
    const startCriticalLoop = useCallback(async (id) => {
        Object.keys(loopSourcesRef.current).forEach(k => {
            try { stopLoop(k); } catch (e) {}
        });

        const buffer = await loadSound();
        const ok = await unlockAudio();

        if (!ok || !buffer) return;

        const ctx = audioCtxRef.current;
        try {
            const src = ctx.createBufferSource();
            src.buffer = buffer;
            src.loop = true;
            src.connect(ctx.destination);
            src.start(0);

            loopSourcesRef.current[id] = src;

        } catch (err) {
            console.error('useAlertAudio: failed to start critical loop.', err);
        }
    }, [loadSound, unlockAudio, stopLoop]);

    // preload and unlock on interaction
    useEffect(() => {
        loadSound();

        window.addEventListener('click', unlockAudio);
        window.addEventListener('keydown', unlockAudio);
        window.addEventListener('rg:attemptAudioUnlock', unlockAudio);

        return () => {
            audioCtxRef.current?.close();
            audioCtxRef.current = null;
            bufferRef.current = null;
            unlockedRef.current = false;

            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
            window.removeEventListener('rg:attemptAudioUnlock', unlockAudio);
        };
    }, [unlockAudio, loadSound]);

    return { playSound, stopLoop, startCriticalLoop, audioUnlocked: unlockedRef.current };
};

export default useAlertAudio;