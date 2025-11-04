import { auth, db } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const registerBtn = document.getElementById('register-btn');
    const loginBtn = document.getElementById('login-btn');
    const errorMessage = document.getElementById('error-message');

    // Handle Registration
    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;

            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Store user role in Firestore
                await db.collection('users').doc(user.uid).set({
                    email: user.email,
                    role: role
                });

                // Redirect to login page after successful registration
                window.location.href = 'index.html';

            } catch (error) {
                errorMessage.textContent = error.message;
            }
        });
    }

    // Handle Login
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                await auth.signInWithEmailAndPassword(email, password);
                // Auth state change will handle redirection
            } catch (error) {
                errorMessage.textContent = error.message;
            }
        });
    }

    // Auth State Listener for Redirection
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is logged in, get their role and redirect
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    if (userData.role === 'ambulance') {
                        window.location.href = 'ambulance/index.html';
                    } else if (userData.role === 'hospital') {
                        window.location.href = 'hospital/index.html';
                    } else {
                        errorMessage.textContent = 'No role assigned to this user.';
                    }
                } else {
                     errorMessage.textContent = 'User data not found.';
                }
            } catch (error) {
                errorMessage.textContent = 'Error fetching user data: ' + error.message;
            }
        } else {
            // User is logged out. If they are on a protected page, redirect to login.
            const currentPage = window.location.pathname;
            if (currentPage.includes('/ambulance/') || currentPage.includes('/hospital/')) {
                window.location.href = '../index.html';
            }
        }
    });
});