import { initializeApp } from 'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js';

const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

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

const triageBoardBody = document.getElementById('triage-board-body');

const ambulancesRef = ref(database, 'ambulances');
onValue(ambulancesRef, (snapshot) => {
    triageBoardBody.innerHTML = '';
    const ambulances = snapshot.val();
    for (const ambulanceId in ambulances) {
        const ambulance = ambulances[ambulanceId];
        if (ambulance.encrypted_vitals) {
            renderAmbulanceRow(ambulanceId, ambulance.encrypted_vitals);
        }
    }
});

async function renderAmbulanceRow(ambulanceId, encryptedVitals) {
    const decryptedVitals = await decryptData(encryptedVitals);
    if (!decryptedVitals) return;

    const { patient_name, vitals, mode, timestamp } = decryptedVitals;
    const isCritical = mode === 'critical';

    const row = document.createElement('tr');
    row.className = 'border-b border-gray-700';
    if (isCritical) {
        row.classList.add('animate-pulse-red');
    }

    row.innerHTML = `
        <td class="p-4">
            ${isCritical ? `<div class="text-red-500 text-2xl">⚠️</div>` : ''}
        </td>
        <td class="p-4">
            <div class="font-bold">${patient_name}</div>
        </td>
        <td class="p-4">
            <div>${ambulanceId}</div>
        </td>
        <td class="p-4 font-mono">
            ${vitals.heart_rate} / ${vitals.spO2}% / ${vitals.temperature}°C
        </td>
        <td class="p-4">
            <span class="px-2 py-1 rounded-full text-sm ${isCritical ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}">
                ${mode.toUpperCase()}
            </span>
        </td>
        <td class="p-4">${new Date(timestamp * 1000).toLocaleTimeString()}</td>
        <td class="p-4">
            <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded">View History</button>
        </td>
    `;

    triageBoardBody.appendChild(row);
}

async function decryptData(encryptedPackage) {
    try {
        const key = await window.crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode("password"),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        const aesKey = await window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: new Uint8Array([170, 254, 35, 69, 103, 137, 222, 173, 190, 239, 18, 52, 86, 120, 144, 171]),
                iterations: 1000000,
                hash: "SHA-256"
            },
            key,
            { name: "AES-GCM", length: 128 },
            true,
            ["encrypt", "decrypt"]
        );

        const ciphertext = Uint8Array.from(atob(encryptedPackage.ciphertext), c => c.charCodeAt(0));
        const nonce = Uint8Array.from(atob(encryptedPackage.nonce), c => c.charCodeAt(0));
        const authTag = Uint8Array.from(atob(encryptedPackage.auth_tag), c => c.charCodeAt(0));

        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: nonce,
                tagLength: 128
            },
            aesKey,
            ciphertext
        );

        const decryptedData = JSON.parse(new TextDecoder().decode(decrypted));
        return decryptedData;
    } catch (error) {
        console.error("Decryption error:", error);
        return null;
    }
}
