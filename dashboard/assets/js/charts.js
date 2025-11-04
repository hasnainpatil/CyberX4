let hrChart, spo2Chart;
const MAX_CHART_POINTS = 20;

export function createCharts() {
    const chartOptions = {
        scales: {
            x: { ticks: { display: false } },
            y: { grid: { color: 'rgba(255, 255, 255, 0.1)' } }
        },
        plugins: { legend: { display: false } },
        animation: { duration: 500 },
        maintainAspectRatio: false
    };

    const hrCtx = document.getElementById('hr-chart').getContext('2d');
    hrChart = new Chart(hrCtx, {
        type: 'line',
        data: { labels: [], datasets: [{
            data: [],
            borderColor: '#f87171',
            tension: 0.1,
            fill: false
        }]},
        options: chartOptions
    });

    const spo2Ctx = document.getElementById('spo2-chart').getContext('2d');
    spo2Chart = new Chart(spo2Ctx, {
        type: 'line',
        data: { labels: [], datasets: [{
            data: [],
            borderColor: '#60a5fa',
            tension: 0.1,
            fill: false
        }]},
        options: chartOptions
    });
}

function addDataToChart(chart, label, data) {
    if (!chart) return;
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(data);

    if (chart.data.labels.length > MAX_CHART_POINTS) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }
    chart.update();
}

export function updateCharts(vitals) {
    if (!hrChart || !spo2Chart) return;
    const timestamp = new Date().toLocaleTimeString();
    addDataToChart(hrChart, timestamp, vitals.heart_rate);
    addDataToChart(spo2Chart, timestamp, vitals.spO2);
}