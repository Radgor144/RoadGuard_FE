import {mapEarToFocusPercent} from "../../mediapipe/components/DriverMonitoring/EarToPercent";

export const normalizeDate = (t) => {
    if (t instanceof Date) return t.toISOString();
    return String(t);
};

export const processEarData = (rawData) => {
    if (!rawData || rawData.length === 0) return [];

    let formattedData = rawData.map(item => ({
        timestamp: new Date(item.timestamp),
        focusPercentage: mapEarToFocusPercent(item.averageEar)
    }));

    formattedData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const dataWithGaps = [];
    const GAP_THRESHOLD_MS = 15 * 60 * 1000; // 15 minut

    for (let i = 0; i < formattedData.length; i++) {
        const current = formattedData[i];
        if (i > 0) {
            const prev = formattedData[i - 1];
            // Jeśli przerwa jest zbyt duża, wstawiamy punkt "pusty"
            if ((current.timestamp.getTime() - prev.timestamp.getTime()) > GAP_THRESHOLD_MS) {
                dataWithGaps.push({
                    timestamp: new Date(prev.timestamp.getTime() + 1000),
                    focusPercentage: null
                });
            }
        }
        dataWithGaps.push(current);
    }
    return dataWithGaps;
};

export const processSessions = (sessionsJson) => {
    return Array.isArray(sessionsJson) ? sessionsJson.map((s, index) => ({
        ...s,
        id: s.id || (index + 1),
        startTime: s.startTime,
        endTime: s.endTime
    })) : [];
};

export const formatMinutesToHMM = (minutes) => {
    if (!minutes) return '0 min';
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return h === 0 ? `${m} min` : `${h}h ${m} min`;
};

export const calculateStats = (dataset) => {
    if (!dataset || dataset.length === 0) return null;

    const validPoints = dataset.filter(d => d.focusPercentage !== null);

    if (validPoints.length === 0) return null;

    const values = validPoints.map(d => d.focusPercentage);

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;

    const min = Math.min(...values);

    const highFocusCount = values.filter(v => v >= 50).length;
    const highFocusPercentage = (highFocusCount / values.length) * 100;

    let totalMs = 0;
    const GAP_THRESHOLD = 15 * 60 * 1000;

    for (let i = 1; i < dataset.length; i++) {
        const current = dataset[i];
        const prev = dataset[i - 1];

        // Jeśli któryś z punktów jest "dziurą", nie liczymy czasu między nimi
        if (current.focusPercentage === null || prev.focusPercentage === null) continue;

        const diff = current.timestamp.getTime() - prev.timestamp.getTime();

        // Dodatkowe zabezpieczenie: jeśli mimo braku null, różnica jest duża, nie dodajemy
        if (diff < GAP_THRESHOLD) {
            totalMs += diff;
        }
    }

    // Jeśli mamy punkty, ale czas wyszedł 0 (np. 1 punkt), dajemy min. 1 minutę
    const totalMinutes = totalMs > 0 ? Math.round(totalMs / 60000) : (validPoints.length > 0 ? 1 : 0);

    return {
        avg,
        min,
        highFocusPercentage,
        totalMinutes
    };
};