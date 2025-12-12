// useAlertAudio.js
import {useRef, useEffect, useCallback} from 'react';
import {AUDIO_FILES} from './AlertConstants';

export const useAlertAudio = () => {
    const audioEls = useRef({});
    const audioLoopRefs = useRef({});
    const audioUnlocked = useRef(false);

    const unlockAudio = useCallback(() => {
        if (audioUnlocked.current) return;
        try {
            Object.values(audioEls.current).forEach(base => {
                if (!base) return;
                const p = base.cloneNode(true);
                p.muted = true;
                p.play().then(() => {
                    p.pause();
                    p.currentTime = 0;
                }).catch(() => {
                });
            });
            audioUnlocked.current = true;
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        } catch (e) {
            // ignore
        }
    }, [unlockAudio]);

    useEffect(() => {
        Object.keys(AUDIO_FILES).forEach(key => {
            try {
                const a = new Audio(AUDIO_FILES[key]);
                a.preload = 'auto';
                audioEls.current[key] = a;
            } catch (e) {
                audioEls.current[key] = null;
            }
        });
        window.addEventListener('click', unlockAudio);
        window.addEventListener('keydown', unlockAudio);
        window.addEventListener('rg:attemptAudioUnlock', unlockAudio);
        return () => {
            Object.values(audioEls.current).forEach(a => {
                if (a && typeof a.pause === 'function') try {
                    a.pause();
                } catch (e) {
                }
            });
            audioEls.current = {};
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
            window.removeEventListener('rg:attemptAudioUnlock', unlockAudio);
        };
    }, [unlockAudio]);

    const playSound = useCallback((type) => {
        const base = audioEls.current[type];
        if (!base) return;
        try {
            const a = base.cloneNode(true);
            a.preload = 'auto';
            const cleanup = () => {
                try {
                    a.pause();
                    a.src = '';
                } catch (e) {
                }
            };
            a.addEventListener('ended', cleanup);
            a.play().catch(() => { /* autoplay blocked or error */
            });
            setTimeout(cleanup, 8000);
        } catch (e) {
            // ignore playback errors
        }
    }, []);

    const stopLoop = useCallback((id) => {
        const h = audioLoopRefs.current[id];
        if (!h) return;
        try {
            if (h.el) {
                h.el.loop = false;
                h.el.pause();
                h.el.currentTime = 0;
                try {
                    h.el.src = '';
                } catch (e) {
                }
            } else if (Array.isArray(h.els)) {
                h.els.forEach(el => {
                    if (el) {
                        el.loop = false;
                        el.pause();
                        el.currentTime = 0;
                        try {
                            el.src = '';
                        } catch (e) {
                        }
                    }
                });
            }
        } catch (e) {
        }
        delete audioLoopRefs.current[id];
    }, []);

    const startCriticalLoop = useCallback((id) => {
        if (audioLoopRefs.current[id]) return;
        // stop any other loops to ensure only one critical loop plays at a time
        Object.keys(audioLoopRefs.current).forEach(k => {
            try {
                stopLoop(k);
            } catch (e) {
            }
        });
        let src = AUDIO_FILES.critical;
        let el;
        el = new Audio(src);
        el.preload = 'auto';
        el.loop = true;
        el.play().catch(() => {
        });
        audioLoopRefs.current[id] = {el};

    }, [stopLoop]);

    return {playSound, stopLoop, startCriticalLoop, audioUnlocked: audioUnlocked.current};
};