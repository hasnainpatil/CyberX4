const KEY_SALT = "aafe23456789deadbeef1234567890ab";
let cryptoKey;

async function deriveKey(password) {
    const passwordBuffer = new TextEncoder().encode(password);
    const saltBuffer = new Uint8Array(KEY_SALT.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    const baseKey = await window.crypto.subtle.importKey(
        "raw",
        passwordBuffer,
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return await window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: saltBuffer,
            iterations: 1000000,
            hash: "SHA-256"
        },
        baseKey,
        { name: "AES-GCM", length: 128 },
        true,
        ["decrypt"]
    );
}

export async function handleLogin(password, role) {
    const loginError = document.getElementById('login-error');
    if (password.length < 8) {
        loginError.textContent = "Password must be at least 8 characters.";
        return null;
    }

    loginError.textContent = "Deriving key, please wait...";

    try {
        cryptoKey = await deriveKey(password);
        console.log("Generated AES Key (native)");
        loginError.textContent = "";
        document.getElementById('login-overlay').style.display = 'none';
        return { cryptoKey, role };
    } catch (error) {
        console.error("Key Derivation Failed:", error);
        loginError.textContent = "Key derivation failed. Check console.";
        return null;
    }
}

export function getCryptoKey() { return cryptoKey; }