import { initializeApp } from 'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js';
import { firebaseConfig } from './firebase.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '../index.html';
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = '../index.html';
    });
});

document.getElementById('start-simulation-btn').addEventListener('click', async () => {
    const firebase_url = document.getElementById('firebase-url').value;
    const ambulance_id = document.getElementById('ambulance-id').value;
    const mode = document.getElementById('mode').value;

    if (!firebase_url || !ambulance_id) {
        alert('Firebase URL and Ambulance ID are required');
        return;
    }

    try {
        const response = await fetch('http://localhost:5001/start_simulation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ firebase_url, ambulance_id, mode })
        });

        const data = await response.json();

        if (data.status === 'success') {
            alert('Simulation started successfully');
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Error starting simulation:', error);
        alert('Failed to start simulation');
    }
});

document.getElementById('stop-simulation-btn').addEventListener('click', async () => {
    const ambulance_id = document.getElementById('ambulance-id').value;

    if (!ambulance_id) {
        alert('Ambulance ID is required');
        return;
    }

    try {
        const response = await fetch('http://localhost:5001/stop_simulation', {
            method: 'POST',            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ambulance_id })
        });

        const data = await response.json();

        if (data.status === 'success') {
            alert('Simulation stopped successfully');
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Error stopping simulation:', error);
        alert('Failed to stop simulation');
    }
});

async function fetchDoctors() {
    try {
        const response = await fetch('../../doctors.json');
        const doctors = await response.json();
        const doctorsList = document.getElementById('doctors-list');
        doctorsList.innerHTML = '';
        doctors.forEach(doctor => {
            const li = document.createElement('li');
            li.className = 'bg-gray-700 p-4 rounded-lg flex justify-between items-center';
            li.innerHTML = `
                <div>
                    <p class="font-bold">${doctor.name}</p>
                    <p class="text-sm text-gray-400">${doctor.specialty}</p>
                </div>
                <a href="tel:${doctor.phone}" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Call</a>
            `;
            doctorsList.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching doctors:', error);
    }
}

fetchDoctors();