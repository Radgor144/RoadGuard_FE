import React, { useMemo } from 'react';
import { Box, Typography, useMediaQuery } from '@mui/material';
import { useStatsData } from './StatsContext';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceArea,
    Legend
} from 'recharts';
import { format } from 'date-fns';

export default function FocusPerTimeChart() {
    const { dataset, breaks, loading, error, startTime, endTime } = useStatsData();
    const isCompactChart = useMediaQuery('(max-width:750px)');

    // Usunięto: const [chartWidth, setChartWidth] = useState(450);
    // Usunięto: cały blok useEffect do obliczania chartWidth

    const chartData = useMemo(() => {
        if (!dataset) return [];
        const dataWithBreaks = [...dataset];

        breaks?.forEach(b => {
            dataWithBreaks.push({ timestamp: new Date(b.startTime).getTime(), focus: null });
            dataWithBreaks.push({ timestamp: new Date(b.endTime).getTime(), focus: null });
        });

        return dataWithBreaks
            .map(d => ({
                timestamp: d.timestamp instanceof Date ? d.timestamp.getTime() : new Date(d.timestamp).getTime(),
                focus: d.focusPercentage ?? d.focus ?? null
            }))
            .sort((a, b) => a.timestamp - b.timestamp);
    }, [dataset, breaks]);

    const computedDomain = useMemo(() => {
        if (!chartData || chartData.length === 0) {
            return [new Date(startTime).getTime(), new Date(endTime).getTime()];
        }

        const timestamps = chartData.map(d => d.timestamp);
        const minDataTime = Math.min(...timestamps);
        const maxDataTime = Math.max(...timestamps);
        const duration = maxDataTime - minDataTime;
        const buffer = duration < 3600000 ? 15 * 60 * 1000 : duration * 0.05;

        // Uproszczenie zwracanego zakresu
        return [
            minDataTime - buffer,
            maxDataTime + buffer
        ];
    }, [chartData]); // Usunięto startTime i endTime z dependencies, ponieważ computedDomain jest oparty na chartData.

    const breakAreas = useMemo(() => {
        return breaks?.map((b, i) => ({
            id: `break-${i}`,
            x1: new Date(b.startTime).getTime(),
            x2: new Date(b.endTime).getTime(),
            duration: b.durationMinutes
        })) || [];
    }, [breaks]);

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
        const oneDay = 24 * 60 * 60 * 1000;
        const fiveDays = 5 * oneDay;

        if (duration <= fiveDays) {
            // Dla "Last Week" i krócej, pokaż datę i godzinę
            return format(new Date(tickItem), 'dd.MM HH:mm');
        } else {
            // Dla "Last 3 months" i dłużej, pokaż tylko datę
            return format(new Date(tickItem), 'dd.MM');
        }
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

    return (
        <Box sx={{ width: '100%', height: isCompactChart ? 320 : 420, bgcolor: '#1f2937', borderRadius: 2, p: 2 }}>
            <Typography sx={{ color: '#fff', mb: 1 }} fontWeight={700}>Focus per Time</Typography>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} isAnimationActive={false}>
                    <defs>
                        <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
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
                    <Legend />

                    {breakAreas.map(b => (
                        <ReferenceArea
                            key={b.id}
                            x1={b.x1}
                            x2={b.x2}
                            fill="#82ca9d"
                            fillOpacity={0.5}
                            ifOverflow="extendDomain"
                            label={{ position: 'insideTop', value: `Break ${b.duration}m`, fill: '#fff', fontSize: 12 }}
                        />
                    ))}

                    <Area
                        type="monotone"
                        dataKey="focus"
                        stroke="#8884d8"
                        fill="url(#colorFocus)"
                        name="Focus"
                        connectNulls={false}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Box>
    );
}