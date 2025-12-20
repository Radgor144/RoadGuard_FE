import React, {createContext, useContext, useState, useEffect} from 'react';
import {mapEarToFocusPercent} from "../../mediapipe/components/DriverMonitoring/EarToPercent";

const StatsContext = createContext();

export const useStatsData = () => {
    return useContext(StatsContext);
};

export const StatsProvider = ({ children, startTime, endTime }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!startTime || !endTime) return;

        let isMounted = true;

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            const requestData = {
                startTime: startTime,
                endTime: endTime
            };

            try {
                const rg_token = localStorage.getItem('rg_token');
                const res = await fetch(`http://localhost:8082/api/dashboard/ear-data`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(rg_token ? { Authorization: `Bearer ${rg_token}` } : {})
                    },
                    body: JSON.stringify(requestData)
                });

                if (!res.ok) {
                    if (isMounted) {
                        setError(`HTTP ${res.status}`);
                        setData([]);
                    }
                    return;
                }

                const responseData = await res.json();

                if (isMounted) {
                    const rawData = responseData.activeDriveData || [];

                    let formattedData = rawData.map(item => ({
                        timestamp: new Date(item.timestamp),
                        focusPercentage: mapEarToFocusPercent(item.averageEar)
                    }));

                    formattedData.sort((a, b) => a.timestamp - b.timestamp);

                    const dataWithGaps = [];
                    const GAP_THRESHOLD_MS = 15 * 60 * 1000;

                    for (let i = 0; i < formattedData.length; i++) {
                        const current = formattedData[i];
                        if (i > 0) {
                            const prev = formattedData[i - 1];
                            const diff = current.timestamp - prev.timestamp;

                            if (diff > GAP_THRESHOLD_MS) {
                                dataWithGaps.push({
                                    timestamp: new Date(prev.timestamp.getTime() + 1000),
                                    focusPercentage: null
                                });
                            }
                        }
                        dataWithGaps.push(current);
                    }

                    setData(dataWithGaps);
                }
            } catch (err) {
                console.error(err);
                if (isMounted) {
                    setError(err.message);
                    setData([]);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [startTime, endTime]);

    const value = {
        dataset: data,
        loading,
        error,
        startTime,
        endTime
    };

    return (
        <StatsContext.Provider value={value}>
            {children}
        </StatsContext.Provider>
    );
};