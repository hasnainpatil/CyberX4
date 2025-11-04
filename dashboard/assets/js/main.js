import { handleLogin } from './auth.js';
import { loadDashboard } from './ui.js';
import { initFirebase } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('password-input');
    const loginBtnHospital = document.getElementById('login-btn-hospital');
    const loginBtnAmbulance = document.getElementById('login-btn-ambulance');

    if (loginBtnHospital) {
        loginBtnHospital.addEventListener('click', async () => {
            const loginResult = await handleLogin(passwordInput.value, 'hospital');
            if (loginResult) {
                await loadDashboard(loginResult.role);
                // This listener must be added *after* the hospital dashboard is loaded
                document.getElementById('connect-btn').addEventListener('click', () => {
                    const url = document.getElementById('firebase-url').value.trim();
                    if (url && url.startsWith("https://") && (url.endsWith(".firebaseio.com/") || url.endsWith(".firebasedatabase.app/"))) {
                        initFirebase(url);
                    } else {
                        alert("Please enter a valid Firebase URL.");
                    }
                });
            }
        });
    } else {
        console.error("login-btn-hospital not found");
    }

    if (loginBtnAmbulance) {
        loginBtnAmbulance.addEventListener('click', async () => {
            const loginResult = await handleLogin(passwordInput.value, 'ambulance');
            if (loginResult) {
                await loadDashboard(loginResult.role);
            }
        });
    } else {
        console.error("login-btn-ambulance not found");
    }


});