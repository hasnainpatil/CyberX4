# CyberX4 - Secure Real-Time Ambulance Data Transmission System

This is a hackathon project that demonstrates a secure, real-time system for transmitting ambulance data to a hospital dashboard.

## Overview

In emergency situations, the real-time transmission of patient data from an ambulance to a hospital is crucial for preparing for the patient's arrival. This project provides a secure and efficient way to transmit this data.

The system consists of three main components:
1.  **Ambulance Simulator:** A Python script that simulates an ambulance sending patient data.
2.  **Backend Server:** A Python server that receives the data from the ambulance, decrypts it, and forwards it to the hospital dashboard.
3.  **Hospital Dashboard:** A web-based dashboard that displays the incoming patient data in real-time, allowing hospital staff to monitor patients and prepare for their arrival.

## Features

*   **Real-time Data Transmission:** Patient vitals and other data are sent and displayed in real-time.
*   **End-to-End Encryption:** Data is encrypted using AES-128 to ensure patient privacy and data security.
*   **Triage Dashboard:** The hospital dashboard includes a triage board that prioritizes patients based on the criticality of their condition.
*   **Data Visualization:** The dashboard provides a clear and concise visualization of patient data.

## Technology Stack

*   **Frontend:** HTML, Tailwind CSS, JavaScript
*   **Backend:** Python
*   **Real-time Communication:** Firebase Realtime Database
*   **Encryption:** AES-128

## Project Structure

```
.
├── dashboard/              # Frontend dashboard application
│   ├── assets/             # CSS and JavaScript files
│   ├── ambulance/
│   ├── hospital/
│   └── index.html          # Main dashboard page
├── simulator/
│   └── ambulance_simulator.py # Simulates ambulance data
├── config.py               # Server configuration
├── generate_key.py         # Script to generate a new AES encryption key
├── requirements.txt        # Python dependencies
├── server.py               # Python backend server
└── README.md
```

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Set up Firebase:**
    *   Create a new Firebase project.
    *   Create a Realtime Database.
    *   Enable anonymous authentication.
    *   Copy your Firebase project configuration and paste it into `dashboard/assets/js/firebase.js`.

4.  **Generate Encryption Key:**
    Generate a new AES-128 encryption key by running the `generate_key.py` script:
    ```bash
    python generate_key.py
    ```
    This will print a 32-character hexadecimal key.

5.  **Configure the Encryption Key:**
    *   Open `config.py` and paste the generated key into the `AES_KEY` variable.
    *   Open `dashboard/assets/js/ambulance.js` and paste the generated key into the `AES_KEY` variable.

## How to Run

1.  **Start the backend server:**
    ```bash
    python server.py
    ```

2.  **Run the ambulance simulator:**
    Open a new terminal and run the simulator:
    ```bash
    python simulator/ambulance_simulator.py
    ```

3.  **Open the dashboard:**
    Open `dashboard/index.html` in your web browser to view the hospital dashboard.

## License

This project is licensed under the terms of the LICENSE file.
