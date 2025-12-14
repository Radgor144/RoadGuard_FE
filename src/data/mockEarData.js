// Mock database with EAR (Eye Aspect Ratio) measurements over time
// EAR values typically range from 0.2 to ~0.4, where lower values indicate drowsiness
import { mapEarToFocusPercent } from '../mediapipe/components/DriverMonitoring/EarToPercent';

const generateMockEarData = () => {
    const data = [];
    const now = new Date();

    // Generate data for the last 60 minutes (1 measurement per minute)
    for (let i = 60; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 1000);

        // Simulate realistic EAR values with some variation
        // Minimum EAR is 0.2 (threshold for closed eyes)
        // Normal awake EAR: 0.27-0.4
        // Drowsy EAR: 0.2-0.27

        let earValue;
        if (i > 45) {
            // Start awake (0.30-0.38)
            earValue = 0.30 + Math.random() * 0.08;
        } else if (i > 30) {
            // Getting slightly tired (0.27-0.33)
            earValue = 0.27 + Math.random() * 0.06;
        } else if (i > 15) {
            // More tired with occasional dips (0.23-0.30)
            earValue = 0.23 + Math.random() * 0.07;
        } else if (i > 5) {
            // Very drowsy (0.20-0.26)
            earValue = 0.20 + Math.random() * 0.06;
        } else {
            // Critical drowsiness (0.20-0.23)
            earValue = 0.20 + Math.random() * 0.03;
        }

        // Add occasional blinks (sudden drops to minimum)
        if (Math.random() > 0.85) {
            earValue = Math.max(0.20, earValue - 0.08);
        }

        // Ensure minimum of 0.2
        earValue = Math.max(0.20, earValue);

        data.push({
            timestamp: timestamp.toISOString(),
            timeLabel: timestamp.toLocaleTimeString('pl-PL', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            earValue: parseFloat(earValue.toFixed(3)),
            // Use the mapEarToFocusPercent function for proper percentage calculation
            focusPercentage: mapEarToFocusPercent(earValue)
        });
    }

    return data;
};

// Alternative: Static mock data for more predictable testing
export const staticMockEarData = [
    { timestamp: '2025-12-13T10:00:00Z', timeLabel: '10:00', earValue: 0.38, focusPercentage: 100 },
    { timestamp: '2025-12-13T10:05:00Z', timeLabel: '10:05', earValue: 0.36, focusPercentage: 90 },
    { timestamp: '2025-12-13T10:10:00Z', timeLabel: '10:10', earValue: 0.37, focusPercentage: 95 },
    { timestamp: '2025-12-13T10:15:00Z', timeLabel: '10:15', earValue: 0.34, focusPercentage: 75 },
    { timestamp: '2025-12-13T10:20:00Z', timeLabel: '10:20', earValue: 0.33, focusPercentage: 70 },
    { timestamp: '2025-12-13T10:25:00Z', timeLabel: '10:25', earValue: 0.31, focusPercentage: 60 },
    { timestamp: '2025-12-13T10:30:00Z', timeLabel: '10:30', earValue: 0.30, focusPercentage: 56 },
    { timestamp: '2025-12-13T10:35:00Z', timeLabel: '10:35', earValue: 0.29, focusPercentage: 50 },
    { timestamp: '2025-12-13T10:40:00Z', timeLabel: '10:40', earValue: 0.28, focusPercentage: 46 },
    { timestamp: '2025-12-13T10:45:00Z', timeLabel: '10:45', earValue: 0.27, focusPercentage: 43 },
    { timestamp: '2025-12-13T10:50:00Z', timeLabel: '10:50', earValue: 0.25, focusPercentage: 32 },
    { timestamp: '2025-12-13T10:55:00Z', timeLabel: '10:55', earValue: 0.23, focusPercentage: 21 },
    { timestamp: '2025-12-13T11:00:00Z', timeLabel: '11:00', earValue: 0.22, focusPercentage: 14 },
    { timestamp: '2025-12-13T11:05:00Z', timeLabel: '11:05', earValue: 0.21, focusPercentage: 7 },
    { timestamp: '2025-12-13T11:10:00Z', timeLabel: '11:10', earValue: 0.20, focusPercentage: 0 },
];

export const mockEarData = generateMockEarData();

export default mockEarData;

