from flask import Flask, jsonify, request
from flask_cors import CORS
import threading
import time
import random
from faker import Faker
import binascii
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
import base64
from Crypto.Protocol.KDF import PBKDF2
from Crypto.Hash import SHA256
import requests
import json
from config import DATABASE_URL

app = Flask(__name__)
CORS(app)

# --- 1. CONFIGURATION ---
SECRET_PASSWORD = "password"
KEY_SALT = binascii.unhexlify("aafe23456789deadbeef1234567890ab")
SECRET_KEY = PBKDF2(SECRET_PASSWORD, KEY_SALT, dkLen=16, count=1000000, hmac_hash_module=SHA256)

# --- 2. ENCRYPTION SETUP ---
def encrypt_data(data):
    try:
        data_bytes = json.dumps(data).encode('utf-8')
        nonce = get_random_bytes(12)
        cipher = AES.new(SECRET_KEY, AES.MODE_GCM, nonce=nonce)
        ciphertext, auth_tag = cipher.encrypt_and_digest(data_bytes)
        return {
            "ciphertext": base64.b64encode(ciphertext).decode('utf-8'),
            "nonce": base64.b64encode(nonce).decode('utf-8'),
            "auth_tag": base64.b64encode(auth_tag).decode('utf-8')
        }
    except Exception as e:
        print(f"Encryption error: {e}")
        return None

# --- 3. VITAL SIGNS GENERATOR ---
def get_vitals(mode):
    if mode == 'stable':
        return {
            "heart_rate": random.randint(70, 95),
            "spO2": random.randint(96, 99),
            "temperature": round(random.uniform(36.1, 37.2), 1)
        }
    elif mode == 'urgent':
        return {
            "heart_rate": random.randint(100, 119),
            "spO2": random.randint(91, 94),
            "temperature": round(random.uniform(37.5, 38.5), 1)
        }
    elif mode == 'critical':
        return {
            "heart_rate": random.randint(120, 160),
            "spO2": random.randint(80, 89),
            "temperature": round(random.uniform(38.6, 40.0), 1)
        }

# --- 4. SIMULATOR LOGIC ---
simulations = {}

def run_simulator(mode, ambulance_id):
    fake = Faker()
    patient_name = fake.name()
    firebase_data_path = f"{DATABASE_URL}/ambulances/{ambulance_id}/encrypted_vitals.json"
    
    while simulations.get(ambulance_id):
        vitals = get_vitals(mode)
        payload = {
            "ambulance_id": ambulance_id,
            "patient_name": patient_name,
            "vitals": vitals,
            "mode": mode,
            "timestamp": time.time()
        }
        encrypted_package = encrypt_data(payload)
        if encrypted_package:
            data_to_send = json.dumps(encrypted_package)
            try:
                response = requests.put(firebase_data_path, data=data_to_send)
                if response.status_code == 200:
                    print(f"[OK] Ambulance {ambulance_id} ({mode.upper()}) | HR: {vitals['heart_rate']} | SpO2: {vitals['spO2']}% | Sent to Firebase")
                else:
                    print(f"[Error] Failed to send data for {ambulance_id}. Firebase responded with: {response.status_code}")
            except requests.exceptions.RequestException as e:
                print(f"[Connection Error] Could not connect to Firebase for {ambulance_id}. Error: {e}")
        else:
            print(f"[Error] Failed to encrypt data for {ambulance_id}.")
        time.sleep(random.randint(2, 4))

@app.route('/start_simulation', methods=['POST'])
def start_simulation():
    data = request.json
    mode = data.get("mode", "stable")
    ambulance_id = data.get("ambulance_id")

    if not ambulance_id:
        return jsonify({"status": "error", "message": "ambulance_id is required"}), 400

    if ambulance_id in simulations:
        return jsonify({"status": "error", "message": f"Simulation for ambulance {ambulance_id} is already running"}), 400

    simulations[ambulance_id] = True
    thread = threading.Thread(target=run_simulator, args=(mode, ambulance_id))
    thread.start()
    
    return jsonify({"status": "success", "message": f"Simulation started for ambulance {ambulance_id}"})

@app.route('/stop_simulation', methods=['POST'])
def stop_simulation():
    data = request.json
    ambulance_id = data.get("ambulance_id")

    if not ambulance_id:
        return jsonify({"status": "error", "message": "ambulance_id is required"}), 400

    if ambulance_id in simulations:
        simulations[ambulance_id] = False
        del simulations[ambulance_id]
        return jsonify({"status": "success", "message": f"Simulation stopped for ambulance {ambulance_id}"})
    else:
        return jsonify({"status": "error", "message": f"No simulation found for ambulance {ambulance_id}"}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5001)
