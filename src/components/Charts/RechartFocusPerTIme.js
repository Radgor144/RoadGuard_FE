import React, { useMemo } from 'react';
import { Box, Typography, useMediaQuery } from '@mui/material';
import { useStatsData } from './StatsContext';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea, Legend
} from 'recharts';
import { format } from 'date-fns';

const GAP_THRESHOLD_MS = 2 * 60 * 1000;

export default function RechartFocusPerTime() {
    const { dataset, loading, error, startTime, endTime } = useStatsData();
    const isCompactChart = useMediaQuery('(max-width:750px)');

    const { chartData, breakAreas } = useMemo(() => {
        if (!dataset || dataset.length === 0) return { chartData: [], breakAreas: [] };

        const sortedData = dataset.map(d => ({
            timestamp: d.timestamp.getTime(),
            focus: d.focusPercentage
        })).sort((a, b) => a.timestamp - b.timestamp);

        const processedData = [];
        const detectedBreaks = [];

        for (let i = 0; i < sortedData.length; i++) {
            const current = sortedData[i];

            processedData.push(current);

            if (i < sortedData.length - 1) {
                const next = sortedData[i + 1];
                const diff = next.timestamp - current.timestamp;

                if (diff > GAP_THRESHOLD_MS) {
                    detectedBreaks.push({
                        id: `gap-${i}`,
                        x1: current.timestamp,
                        x2: next.timestamp,
                        duration: Math.round(diff / 60000)
                    });

                    processedData.push({
                        timestamp: current.timestamp + 1,
                        focus: null
                    });
                }
            }
        }

        return { chartData: processedData, breakAreas: detectedBreaks };
    }, [dataset]);

    const computedDomain = useMemo(() => {
        if (!chartData || chartData.length === 0) {
            return [new Date(startTime).getTime(), new Date(endTime).getTime()];
        }
        const timestamps = chartData.map(d => d.timestamp);
        const minDataTime = Math.min(...timestamps);
        const maxDataTime = Math.max(...timestamps);
        const duration = maxDataTime - minDataTime;
        const buffer = duration < 3600000 ? 15 * 60 * 1000 : duration * 0.05;

        return [minDataTime - buffer, maxDataTime + buffer];
    }, [chartData, startTime, endTime]);

    const ticks = useMemo(() => {
        const [start, end] = computedDomain;
        const step = Math.max(Math.floor((end - start) / 10), 60 * 1000);
        const result = [];
        for (let t = start; t <= end; t += step) result.push(t);
        return result;
    }, [computedDomain]);

    const formatXAxis = (tickItem) => {
        const [start, end] = computedDomain;
        const duration = end - start;
        return duration <= (5 * 24 * 3600 * 1000)
            ? format(new Date(tickItem), 'dd.MM HH:mm')
            : format(new Date(tickItem), 'dd.MM');
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length || payload[0].value == null) return null;
        return (
            <Box sx={{ bgcolor: '#111827', p: 1.5, borderRadius: 1 }}>
                <Typography sx={{ color: '#fff', fontSize: 12 }}>
                    {format(new Date(label), 'dd.MM.yyyy HH:mm:ss')}
                </Typography>
                <Typography sx={{ color: '#fff', fontWeight: 600 }}>
                    Focus: {payload[0].value}%
                </Typography>
            </Box>
        );
    };

    if (loading) return <Typography sx={{ color: '#fff' }}>Loading data...</Typography>;
    if (error) return <Typography sx={{ color: '#fff' }}>Error: {error}</Typography>;
    if (!dataset || dataset.length === 0) return <Typography sx={{ color: '#fff' }}>No data available</Typography>;

    const gradientId = "colorFocusSession";

    return (
        <Box sx={{ width: '100%', height: isCompactChart ? 320 : 420, bgcolor: '#1f2937', borderRadius: 2, p: 2 }}>
            <Typography sx={{ color: '#fff', mb: 1 }} fontWeight={700}>Focus per Time</Typography>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                    isAnimationActive={false}
                >
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                    </defs>

                    <XAxis
                        dataKey="timestamp"
                        type="number"
                        scale="time"
                        domain={computedDomain}
                        ticks={ticks}
                        tickFormatter={formatXAxis}
                        interval={0}
                        tick={{ fill: '#fff', fontSize: 12 }}
                    />
                    <YAxis
                        domain={[0, 100]}
                        label={{ value: 'Focus (%)', angle: -90, position: 'insideLeft', fill: '#fff' }}
                        tick={{ fill: '#fff' }}
                    />
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                    <Tooltip content={<CustomTooltip />} />

                    <Legend wrapperStyle={{ paddingTop: '20px' }} />

                    {breakAreas.map(b => (
                        <ReferenceArea
                            key={b.id}
                            x1={b.x1}
                            x2={b.x2}
                            fill="#82ca9d"
                            fillOpacity={0.3}
                            ifOverflow="extendDomain"
                            label={{
                                position: 'insideTop',
                                value: `Break ~${b.duration}m`,
                                fill: '#fff',
                                fontSize: 12
                            }}
                        />
                    ))}

                    <Area
                        type="monotone"
                        dataKey="focus"
                        stroke="#8884d8"
                        strokeWidth={2}
                        fill={`url(#${gradientId})`}
                        name="Focus"
                        connectNulls={false}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Box>
    );
}