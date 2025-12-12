export const EAR_THRESHOLD = 0.2; // eye closed threshold
export const FOCUS_UPDATE_INTERVAL = 2000; // ms
export const TOP_N_SAMPLES = 10; // sample count for averaging

// focus EAR mapping constants
export const FOCUS_EAR_MIN_MAP = EAR_THRESHOLD; // mapping to 0%
export const FOCUS_EAR_LEVEL_1 = 0.27; // mapping to 25%
export const FOCUS_EAR_LEVEL_2 = 0.35; // mapping to 50%
export const FOCUS_EAR_MAX_MAP = 0.4;  // mapping to 100%

// how it works: separate ranges with linear mapping within each range, based on defined levels of EAR
export function mapEarToFocusPercent(EAR) {
    if (typeof EAR !== 'number' || isNaN(EAR)) return 100;

    if (EAR >= FOCUS_EAR_MAX_MAP) return 100;
    if (EAR <= FOCUS_EAR_MIN_MAP) return 0;

    let focusPercent;

    // range 1 - 0% to 25%
    if (EAR < FOCUS_EAR_LEVEL_1) {
        const rangeEar = FOCUS_EAR_LEVEL_1 - FOCUS_EAR_MIN_MAP;
        const earInRange = EAR - FOCUS_EAR_MIN_MAP;
        const rangeFocus = 25;

        focusPercent = rangeFocus * (earInRange / rangeEar);

        // range 2 - 25% to 50%
    } else if (EAR < FOCUS_EAR_LEVEL_2) {
        const rangeEar = FOCUS_EAR_LEVEL_2 - FOCUS_EAR_LEVEL_1;
        const earInRange = EAR - FOCUS_EAR_LEVEL_1;
        const rangeFocus = 25;

        focusPercent = 25 + rangeFocus * (earInRange / rangeEar);

        // range 3 - 50% to 100%
    } else {
        const rangeEar = FOCUS_EAR_MAX_MAP - FOCUS_EAR_LEVEL_2;
        const earInRange = EAR - FOCUS_EAR_LEVEL_2;
        const rangeFocus = 50;

        focusPercent = 50 + rangeFocus * (earInRange / rangeEar);
    }

    return Math.round(focusPercent);
}