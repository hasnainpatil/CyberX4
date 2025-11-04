import { getCryptoKey } from './auth.js';
import { updateVitals } from './ui.js';

let dbRef = null;

async function decryptData(encryptedPackage) {
    const cryptoKey = getCryptoKey();
    if (!cryptoKey) {
        console.error("Decryption key not available.");
        return null;
    }

    try {
        const ciphertext = Uint8Array.from(atob(encryptedPackage.ciphertext), c => c.charCodeAt(0));
        const nonce = Uint8Array.from(atob(encryptedPackage.nonce), c => c.charCodeAt(0));
        const auth_tag = Uint8Array.from(atob(encryptedPackage.auth_tag), c => c.charCodeAt(0));

        const combined_data = new Uint8Array(ciphertext.length + auth_tag.length);
        combined_data.set(ciphertext);
        combined_data.set(auth_tag, ciphertext.length);

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: nonce },
            cryptoKey,
            combined_data
        );

        const decryptedString = new TextDecoder().decode(decryptedBuffer);
        return JSON.parse(decryptedString);
    } catch (error) {
        console.error("DECRYPTION FAILED (Data tampered or wrong key?):", error.message);
        return null;
    }
}

export function initFirebase(firebaseUrl) {
    const statusEl = document.getElementById('connection-status');
    if (!getCryptoKey()) {
        alert("Authentication error. Please log in again.");
        window.location.reload();
        return;
    }

    try {
        if (dbRef) dbRef.off();

        const appName = "dashboardApp";
        let firebaseApp;
        if (!firebase.apps.find(app => app.name === appName)) {
            firebaseApp = firebase.initializeApp({ databaseURL: firebaseUrl }, appName);
        } else {
            firebaseApp = firebase.app(appName);
        }

        const database = firebase.database(firebaseApp);
        dbRef = database.ref('encrypted_vitals');

        statusEl.textContent = "Connecting...";
        statusEl.className = "text-sm text-yellow-400 mt-2 text-center";

        dbRef.on('value', async (snapshot) => {
            if (!snapshot.exists()) {
                statusEl.textContent = "Connected. Waiting for data...";
                return;
            }
            statusEl.textContent = "Connected. Encrypted data received!";
            statusEl.className = "text-sm text-green-400 mt-2 text-center";

            const decryptedData = await decryptData(snapshot.val());
            if (decryptedData) {
                updateVitals(decryptedData);
            } else {
                statusEl.textContent = "Error: Decryption Failed. Check Key/Integrity!";
                statusEl.className = "text-sm text-red-500 mt-2 text-center";
            }
        }, (error) => {
            console.error("Firebase Read Error:", error);
            statusEl.textContent = `Error: ${error.message}`;
            statusEl.className = "text-sm text-red-500 mt-2 text-center";
        });
    } catch (error) {
        console.error("Firebase Init Error:", error);
        statusEl.textContent = `Error: ${error.message}`;
        statusEl.className = "text-sm text-red-500 mt-2 text-center";
    }
}