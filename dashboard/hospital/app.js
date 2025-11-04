import { auth, db } from '../assets/js/firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    const triageBoardBody = document.getElementById('triage-board-body');
    const modal = document.getElementById('vitals-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalPatientName = document.getElementById('modal-patient-name');
    const vitalsChartCanvas = document.getElementById('vitals-chart');
    let vitalsChart = null;

    // --- AUTHENTICATION ---
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = '../index.html';
        }
    });

    logoutBtn.addEventListener('click', () => auth.signOut());

    // --- REAL-TIME TRIAGE BOARD ---
    db.collection('trips').where('status', '==', 'En Route')
      .onSnapshot(snapshot => {
          triageBoardBody.innerHTML = ''; // Clear the board
          snapshot.forEach(doc => {
              const trip = doc.data();
              const tripId = doc.id;
              renderTripRow(trip, tripId);
          });
      });

    function renderTripRow(trip, tripId) {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-700 hover:bg-gray-700 cursor-pointer';
        row.dataset.tripId = tripId;
        row.dataset.patientName = trip.patientName;

        const isCritical = trip.latestVitals.hr > 120 || trip.latestVitals.hr < 50 || trip.latestVitals.spo2 < 90;
        const hasAlert = !!trip.alert;

        if (hasAlert) {
            row.classList.add('animate-pulse-red');
        }

        row.innerHTML = `
            <td class="p-4">
                ${hasAlert ? `<div class="text-red-500 text-2xl" title="ALERT: ${trip.alert.message}">⚠️</div>` : ''}
            </td>
            <td class="p-4">
                <div class="font-bold">${trip.patientName}</div>
                <div class="text-sm text-gray-400">${trip.patientCondition}</div>
            </td>
            <td class="p-4">
                <div>${trip.vehicleNumber}</div>
                <div class="text-sm text-gray-400">${trip.driverName}</div>
            </td>
            <td class="p-4 font-mono">
                ${trip.latestVitals.hr || '--'} / ${trip.latestVitals.spo2 || '--'}% / ${trip.latestVitals.bp || '--'}
            </td>
            <td class="p-4">
                <span class="px-2 py-1 rounded-full text-sm ${isCritical ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}">
                    ${isCritical ? 'Critical' : 'Non-Critical'}
                </span>
            </td>
            <td class="p-4">${trip.status}</td>
            <td class="p-4">
                <button data-trip-id="${tripId}" class="arrived-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded">Arrived</button>
            </td>
        `;
        triageBoardBody.appendChild(row);
    }

    // --- EVENT LISTENERS FOR ROWS AND BUTTONS ---
    triageBoardBody.addEventListener('click', (e) => {
        const target = e.target;
        const row = target.closest('tr');
        const arrivedBtn = target.closest('.arrived-btn');

        if (arrivedBtn) {
            const tripId = arrivedBtn.dataset.tripId;
            markAsArrived(tripId);
        } else if (row) {
            const tripId = row.dataset.tripId;
            const patientName = row.dataset.patientName;
            showVitalsHistory(tripId, patientName);
        }
    });

    async function markAsArrived(tripId) {
        if (confirm('Mark this patient as arrived? This will remove them from the live board.')) {
            await db.collection('trips').doc(tripId).update({ status: 'Arrived' });
        }
    }

    // --- VITALS HISTORY MODAL ---
    closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));

    async function showVitalsHistory(tripId, patientName) {
        modalPatientName.textContent = `${patientName}'s Vitals History`;
        modal.classList.remove('hidden');

        const historySnapshot = await db.collection('trips').doc(tripId).collection('vitalsHistory').orderBy('timestamp', 'asc').get();
        
        const labels = [];
        const hrData = [];
        const spo2Data = [];

        historySnapshot.forEach(doc => {
            const data = doc.data();
            labels.push(data.timestamp.toDate().toLocaleTimeString());
            hrData.push(data.hr);
            spo2Data.push(data.spo2);
        });

        if (vitalsChart) {
            vitalsChart.destroy();
        }

        vitalsChart = new Chart(vitalsChartCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Heart Rate (HR)',
                        data: hrData,
                        borderColor: '#f87171',
                        backgroundColor: '#f87171',
                        yAxisID: 'y',
                    },
                    {
                        label: 'SpO2 (%)',
                        data: spo2Data,
                        borderColor: '#60a5fa',
                        backgroundColor: '#60a5fa',
s                        yAxisID: 'y1',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Heart Rate (bpm)' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'SpO2 (%)' },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    }
});