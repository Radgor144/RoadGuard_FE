import { mapEarToFocusPercent } from "../../mediapipe/components/DriverMonitoring/EarToPercent";

export const normalizeDate = (dateInput) => {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);
    const offsetMs = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offsetMs);
    return localDate.toISOString().slice(0, -1);
};

export const formatMinutesToHMM = (totalMinutes) => {
    if (!totalMinutes && totalMinutes !== 0) return '0 min';
    const minutes = Math.round(totalMinutes);
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
};

export const processEarData = (rawData) => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) return [];

    const formattedData = rawData.map(item => ({
        timestamp: new Date(item.timestamp),
        focusPercentage: item.averageEar !== undefined
            ? mapEarToFocusPercent(item.averageEar)
            : (item.focusPercentage != null ? Number(item.focusPercentage) : null)
    }));

    formattedData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    return formattedData;
};

export const processSessions = (sessionsJson) => {
    if (!sessionsJson || !Array.isArray(sessionsJson)) return [];
    return sessionsJson.map((s, index) => ({
        ...s,
        id: s.id || (index + 1),
        startTime: new Date(s.startTime).toISOString(),
        endTime: new Date(s.endTime).toISOString()
    }));
};

export const calculateStats = (dataset) => {
    if (!dataset || dataset.length === 0) return null;

    const validPoints = dataset.filter(d => d.focusPercentage !== null && !isNaN(d.focusPercentage));
    if (validPoints.length === 0) return null;

    const values = validPoints.map(d => d.focusPercentage);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);

    const highFocusCount = values.filter(v => v >= 50).length;
    const highFocusPercentage = (highFocusCount / values.length) * 100;

    let totalMs = 0;
    const GAP_THRESHOLD = 5 * 60 * 1000;

    for (let i = 1; i < validPoints.length; i++) {
        const current = validPoints[i];
        const prev = validPoints[i - 1];
        const diff = current.timestamp.getTime() - prev.timestamp.getTime();

        if (diff < GAP_THRESHOLD) {
            totalMs += diff;
        }
    }

    let totalMinutes = Math.round(totalMs / 60000);
    if (totalMinutes === 0 && validPoints.length > 0) totalMinutes = 1;

    return { avg, min, highFocusPercentage, totalMinutes };
};