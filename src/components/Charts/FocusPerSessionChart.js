import React, {useState, useEffect, useMemo} from 'react';
import {LineChart} from '@mui/x-charts/LineChart';
import {Box, Typography, useMediaQuery} from "@mui/material";
import {useStatsData} from "./StatsContext";

export default function FocusPerTimeChart() {
    // 1. Pobieramy dataset (czyli surowe dane z ear-data) z Contextu
    const { dataset, loading, error, startTime, endTime } = useStatsData();

    const [chartWidth, setChartWidth] = useState(450);
    const isCompactChart = useMediaQuery('(max-width:750px)');

    // Liczba punktów, które chcemy widzieć na wykresie (np. 60 punktów, niezależnie czy to godzina czy miesiąc)
    // Dzięki temu wykres jest zawsze czytelny i szybki.
    const POINTS_COUNT = isCompactChart ? 40 : 80;

    // Logika responsywności
    useEffect(() => {
        const calculateWidth = () => {
            const screenWidth = window.innerWidth;
            if (screenWidth < 600) setChartWidth(screenWidth - 40);
            else if (screenWidth > 1100) setChartWidth(950);
            else setChartWidth(screenWidth - 150);
        };
        calculateWidth();
        window.addEventListener('resize', calculateWidth);
        return () => window.removeEventListener('resize', calculateWidth);
    }, []);

    // Sprawdzenie czy zakres jest wielodniowy (dla formatowania osi)
    const isMultiDay = useMemo(() => {
        if (!startTime || !endTime) return false;
        const start = new Date(startTime);
        const end = new Date(endTime);
        return (end - start) > (24 * 60 * 60 * 1000);
    }, [startTime, endTime]);

    // --- LOGIKA PRZETWARZANIA DANYCH (BINNING) ---
    // Zamienia tysiące punktów z 'ear-data' na ustaloną liczbę uśrednionych punktów (POINTS_COUNT)
    const chartData = useMemo(() => {
        if (!dataset || dataset.length === 0) return [];

        const startMs = new Date(startTime).getTime();
        const endMs = new Date(endTime).getTime();
        const totalDuration = endMs - startMs;

        // Zabezpieczenie przed dzieleniem przez 0
        if (totalDuration <= 0) return [];

        const stepSize = totalDuration / POINTS_COUNT;

        // 1. Tworzymy puste kubełki
        const buckets = new Array(POINTS_COUNT).fill(null).map((_, i) => ({
            timestamp: new Date(startMs + (i * stepSize)),
            sumFocus: 0,
            count: 0
        }));

        // 2. Wrzucamy surowe dane do odpowiednich kubełków
        dataset.forEach(item => {
            // Ignorujemy "przerwy" (null) w obliczaniu średniej
            if (item.focusPercentage === null) return;

            const itemTime = item.timestamp.getTime();
            // Obliczamy indeks kubełka
            const index = Math.floor((itemTime - startMs) / stepSize);

            if (index >= 0 && index < POINTS_COUNT) {
                buckets[index].sumFocus += item.focusPercentage;
                buckets[index].count += 1;
            }
        });

        // 3. Obliczamy średnią dla każdego kubełka
        return buckets.map(bucket => {
            // Jeśli kubełek pusty (brak danych w tym czasie) -> zwracamy null (przerwa na wykresie)
            if (bucket.count === 0) {
                return { timestamp: bucket.timestamp, focusPercentage: null };
            }
            return {
                timestamp: bucket.timestamp,
                focusPercentage: Math.round(bucket.sumFocus / bucket.count)
            };
        });
    }, [dataset, startTime, endTime]);


    // Obsługa stanów ładowania i błędów
    if (loading) return <Typography sx={{color: '#fff', p: 2}}>Loading chart data...</Typography>;
    if (error && !dataset.length) return <Typography sx={{color: '#cb1224', p: 2}}>Error: {error}</Typography>;
    if (!dataset.length) return <Typography sx={{color: '#aaa', p: 2}}>No detailed data for this period.</Typography>;

    return (
        <Box
            sx={{
                bgcolor: '#1f2937',
                borderRadius: 2,
                p: {xs: 1, md: 2},
                boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
                display: 'flex',
                justifyContent: 'center'
            }}
        >
            <LineChart
                width={chartWidth}
                height={isCompactChart ? 300 : 400}
                grid={{ horizontal: true, stroke: 'rgba(255,255,255,0.1)' }}
                sx={{
                    '& .MuiChartsAxis-tickLabel': {fill: '#ccc'},
                    '& .MuiChartsAxis-label': {fill: '#fff'},
                    '& .MuiChartsGrid-line': { stroke: '#fff', strokeOpacity: 0.1 }
                }}
                xAxis={[{
                    scaleType: 'time',
                    data: chartData.map(d => d.timestamp),
                    min: new Date(startTime),
                    max: new Date(endTime),
                    valueFormatter: (date) => isMultiDay
                        ? date.toLocaleDateString('pl-PL', {day:'2-digit', month:'2-digit'}) + ' ' + date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
                        : date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
                    tickNumber: isCompactChart ? 4 : 8,
                }]}
                yAxis={[{
                    min: 0, max: 100, label: 'Focus (%)',
                    labelStyle: { fill: '#fff' },
                    colorMap: {
                        type: 'piecewise',
                        thresholds: [25, 50, 100],
                        colors: ['#cb1224', '#FD9200', '#1B885E']
                    }
                }]}
                series={[{
                    data: chartData.map(d => d.focusPercentage),
                    curve: 'linear', // Linear jest lepszy dla danych naukowych/pomiarowych
                    showMark: false, // Ukrywamy kropki, żeby wykres był czystszy
                    connectNulls: false, // Ważne: nie łączymy linii, gdy jest przerwa w danych!
                    valueFormatter: v => v == null ? '' : `${v}%`
                }]}
                margin={{ left: 50, right: 20, top: 20, bottom: isCompactChart ? 30 : 30 }}
            />
        </Box>
    );
}