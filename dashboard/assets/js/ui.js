import { createCharts, updateCharts } from './charts.js';

const alarmSound = document.getElementById('alarm-sound');
alarmSound.volume = 1.0;
let hrHistory = [];
const TREND_WINDOW = 5;

export async function loadDashboard(role) {
    const container = document.getElementById('dashboard-container');
    let partialUrl;

    if (role === 'hospital') {
        partialUrl = './partials/hospital_dashboard.html';
    } else if (role === 'ambulance') {
        partialUrl = './partials/ambulance_dashboard.html';
    } else {
        container.innerHTML = '<h1 class="text-center text-red-500 mt-10">Invalid user role.</h1>';
        return;
    }

    try {
        const response = await fetch(partialUrl);
        if (!response.ok) throw new Error(`Could not load ${partialUrl}`);
        container.innerHTML = await response.text();

        // If hospital dashboard, initialize its specific components
        if (role === 'hospital') {
            createCharts();
        }
    } catch (error) {
        console.error("Dashboard loading error:", error);
        container.innerHTML = `<h1 class="text-center text-red-500 mt-10">Error loading dashboard: ${error.message}</h1>`;
    }
}

export function updateVitals(data) {
    document.getElementById('hr-value').textContent = data.vitals.heart_rate;
    document.getElementById('spo2-value').textContent = data.vitals.spO2;
    document.getElementById('temp-value').textContent = data.vitals.temperature;
    document.getElementById('amb-id').textContent = data.ambulance_id;
    document.getElementById('patient-name').textContent = data.patient_name;
    updateTrend(data.vitals.heart_rate);
    updateBanner(data.vitals);
    updateCharts(data.vitals);
}

function updateTrend(newHr) {
    const trendEl = document.getElementById('hr-trend');
    hrHistory.push(newHr);
    if (hrHistory.length > TREND_WINDOW) {
        hrHistory.shift();
    }
    if (hrHistory.length < 3) {
        trendEl.textContent = "TREND: --";
        return;
    }
    const firstHalf = hrHistory.slice(0, Math.floor(hrHistory.length / 2));
    const secondHalf = hrHistory.slice(Math.ceil(hrHistory.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (secondAvg > firstAvg + 1) {
        trendEl.textContent = "TREND: RISING ⬆️";
        trendEl.className = "text-center text-lg font-semibold text-red-400 mt-2";
    } else if (secondAvg < firstAvg - 1) {
        trendEl.textContent = "TREND: FALLING ⬇️";
        trendEl.className = "text-center text-lg font-semibold text-blue-400 mt-2";
    } else {
        trendEl.textContent = "TREND: STABLE ➡️";
        trendEl.className = "text-center text-lg font-semibold text-green-400 mt-2";
    }
}

function updateBanner(vitals) {
    const banner = document.getElementById('alert-banner');
    banner.classList.remove('bg-green-500', 'bg-yellow-500', 'bg-red-500', 'animate-pulse-red');
    document.getElementById('hr-card').style.borderColor = '';
    document.getElementById('spo2-card').style.borderColor = '';
    document.getElementById('temp-card').style.borderColor = '';

    let classification = classifyEmergency(vitals);
    switch (classification.level) {
        case 'critical':
            banner.textContent = `🚨 CRITICAL - ${classification.reason} 🚨`;
            banner.classList.add('bg-red-500', 'animate-pulse-red');
            classification.fields.forEach(f => document.getElementById(f).style.borderColor = '#ef4444');
            alarmSound.play().catch(e => console.warn("Audio play failed. User may need to interact with page first."));
            break;
        case 'urgent':
            banner.textContent = `⚠️ URGENT - ${classification.reason} ⚠️`;
            banner.classList.add('bg-yellow-500');
            classification.fields.forEach(f => document.getElementById(f).style.borderColor = '#eab308');
            alarmSound.pause();
            alarmSound.currentTime = 0;
            break;
        default:
            banner.textContent = '✅ STABLE - STANDARD CARE ✅';
            banner.classList.add('bg-green-500');
            alarmSound.pause();
            alarmSound.currentTime = 0;
    }
}

function classifyEmergency(vitals) {
    let { heart_rate: hr, spO2 } = vitals;
    if (hr > 120 || hr < 50 || spO2 < 90) {
        return { level: 'critical', reason: (spO2 < 90) ? "Low Blood Oxygen" : "Critical Heart Rate", fields: ['hr-card', 'spo2-card'] };
    }
    if (hr > 100 || spO2 < 94) {
        return { level: 'urgent', reason: (spO2 < 94) ? "Low Blood Oxygen" : "High Heart Rate", fields: ['hr-card', 'spo2-card'] };
    }
    return { level: 'stable', reason: 'Vitals Stable', fields: [] };
}