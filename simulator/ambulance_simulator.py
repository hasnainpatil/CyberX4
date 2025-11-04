# simulator/ambulance_simulator.py
#
# This script simulates an ambulance sending encrypted patient data
# to a Firebase Realtime Database.

import requests  # For sending HTTP requests to Firebase
import json      # For formatting data as JSON
import time      # For pausing between updates
import random    # For generating realistic vital signs
from faker import Faker # For generating random patient names
import binascii  # For converting our hex key
from Crypto.Cipher import AES # The core AES encryption library
from Crypto.Random import get_random_bytes # For generating IV
import base64    # For encoding encrypted data into a string

from Crypto.Protocol.KDF import PBKDF2
from Crypto.Hash import SHA256

# --- 1. CONFIGURATION ---
# The user (hospital) will type this password in the browser
# The ambulance (simulator) must also know it.
SECRET_PASSWORD = "password" # <-- Must match the password in the dashboard

# A "salt" is a public value that makes the derived key unique.
# This MUST be identical in Python and JavaScript.
KEY_SALT = binascii.unhexlify("aafe23456789deadbeef1234567890ab") # Must be 16 bytes

# --- 2. ENCRYPTION SETUP ---
try:
    # Use PBKDF2 to "stretch" the password into a 16-byte (128-bit) AES key
    SECRET_KEY = PBKDF2(SECRET_PASSWORD, KEY_SALT, dkLen=16, count=1000000, hmac_hash_module=SHA256)
    
    print(f"Generated AES Key: {binascii.hexlify(SECRET_KEY).decode('utf-8')}") # You can check this matches the JS key

    if len(SECRET_KEY) != 16:
        print("Error: Key derivation failed.")
        exit()
except Exception as e:
    print(f"Error: {e}")
    exit()

def encrypt_data(data):
    """
    Encrypts data using AES-128-GCM to provide Confidentiality AND Integrity.
    Uses a 12-BYTE (96-bit) NONCE for compatibility with Web Crypto API.
    """
    try:
        data_bytes = json.dumps(data).encode('utf-8')
        
        # 1. We must explicitly create a 12-byte nonce
        nonce = get_random_bytes(12)
        
        # 2. Create a new AES-GCM cipher and pass in the 12-byte nonce
        cipher = AES.new(SECRET_KEY, AES.MODE_GCM, nonce=nonce)

        # 3. Encrypt the data.
        ciphertext, auth_tag = cipher.encrypt_and_digest(data_bytes)
        
        # 4. Package all 3 parts to send.
        return {
            "ciphertext": base64.b64encode(ciphertext).decode('utf-8'),
            "nonce": base64.b64encode(nonce).decode('utf-8'),     # Send our 12-byte nonce
            "auth_tag": base64.b64encode(auth_tag).decode('utf-8')
        }

    except Exception as e:
        print(f"Encryption error: {e}")
        return None

# --- 3. VITAL SIGNS GENERATOR ---

def get_vitals(mode):
    """
    Generates a set of vital signs based on the emergency mode.
    """
    if mode == 'stable':
        # Normal, healthy vitals
        return {
            "heart_rate": random.randint(70, 95),
            "spO2": random.randint(96, 99),
            "temperature": round(random.uniform(36.1, 37.2), 1)
        }
    elif mode == 'urgent':
        # Concerning vitals, but not immediately life-threatening
        return {
            "heart_rate": random.randint(100, 119),
            "spO2": random.randint(91, 94),
            "temperature": round(random.uniform(37.5, 38.5), 1)
        }
    elif mode == 'critical':
        # Dangerous, life-threatening vitals
        return {
            "heart_rate": random.randint(120, 160), # Tachycardia
            "spO2": random.randint(80, 89),       # Hypoxemia
            "temperature": round(random.uniform(38.6, 40.0), 1) # High Fever
        }

# --- 4. MAIN SIMULATOR LOGIC ---

def run_simulator(firebase_url, mode):
    """
    Main loop for the simulator.
    """
    fake = Faker() # Initialize the fake data generator
    
    # Create a unique "ambulance" for this session
    patient_name = fake.name()
    ambulance_id = f"AMB-{random.randint(100, 999)}"
    print(f"\n--- Starting Simulation ---")
    print(f"Ambulance: {ambulance_id}")
    print(f"Patient: {patient_name}")
    print(f"Mode: {mode.upper()}")
    print(f"Target URL: {firebase_url}")
    print("----------------------------\n")
    
    # The path in Firebase where data will be stored
    # We use a single, predictable path so the dashboard knows where to listen
    firebase_data_path = f"{firebase_url}/encrypted_vitals.json"

    count = 0
    while True:
        count += 1
        
        # 1. Get a new set of vitals
        vitals = get_vitals(mode)
        
        # 2. Prepare the full data payload
        payload = {
            "ambulance_id": ambulance_id,
            "patient_name": patient_name,
            "vitals": vitals,
            "mode": mode,
            "timestamp": time.time() # Current time in seconds
        }
        
        # 3. Encrypt the payload
        encrypted_package = encrypt_data(payload)

        if encrypted_package:
            # 4. Prepare the final data to be sent to Firebase
            # We are now sending the full package, not just "payload"
            data_to_send = json.dumps(encrypted_package)
            
            try:
                # 5. Send the data to Firebase using a PUT request
                response = requests.put(firebase_data_path, data=data_to_send)
                
                # Check if the request was successful (HTTP 200 OK)
                if response.status_code == 200:
                    print(f"[OK] Update #{count} ({mode.upper()}) | HR: {vitals['heart_rate']} | SpO2: {vitals['spO2']}% | Sent to Firebase")
                else:
                    print(f"[Error] Failed to send data. Firebase responded with: {response.status_code}")
                    print(f"Response text: {response.text}")
            
            except requests.exceptions.RequestException as e:
                print(f"[Connection Error] Could not connect to Firebase. Check URL and internet.")
                print(f"Error details: {e}")

        else:
            print("[Error] Failed to encrypt data. Skipping this update.")
            
        # Wait for a few seconds before sending the next update
        time.sleep(random.randint(2, 4))

# --- 5. SCRIPT EXECUTION ---

if __name__ == "__main__":
    print("--- 🚑 Ambulance Data Simulator ---")
    
    # Get Firebase URL from user
    fb_url = input("Enter your Firebase Realtime Database URL: ").strip()
    if not fb_url.endswith("/"):
        fb_url += "/"
    if not fb_url.startswith("https://"):
        print("Warning: URL doesn't start with https://. Adding it.")
        fb_url = "https://" + fb_url
    
    # Get simulation mode from user
    print("\nSelect Simulation Mode:")
    print("  1: STABLE (Normal Vitals)")
    print("  2: URGENT (Concerning Vitals)")
    print("  3: CRITICAL (Dangerous Vitals)")
    
    mode_choice = ""
    mode_map = {'1': 'stable', '2': 'urgent', '3': 'critical'}
    
    while mode_choice not in mode_map:
        mode_choice = input("Enter mode (1, 2, or 3): ").strip()
        
    selected_mode = mode_map[mode_choice]
    
    # Start the simulator
    try:
        run_simulator(fb_url, selected_mode)
    except KeyboardInterrupt:
        print("\n--- Simulation stopped by user ---")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")