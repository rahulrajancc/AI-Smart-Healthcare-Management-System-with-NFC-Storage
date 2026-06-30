# 🏥 AI Smart Healthcare Management System with NFC Storage

![React Native](https://img.shields.io/badge/React%20Native-Mobile-blue?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Backend-success?logo=node.js)
![Express.js](https://img.shields.io/badge/Express.js-API-black?logo=express)
![Python](https://img.shields.io/badge/Python-AI-yellow?logo=python)
![Arduino](https://img.shields.io/badge/Arduino-Hardware-00979D?logo=arduino)
![NFC](https://img.shields.io/badge/NFC-Health%20Card-purple)
![License](https://img.shields.io/badge/License-Educational-lightgrey)

An AI-powered healthcare platform that combines **React Native**, **Node.js**, **Python AI**, and **Arduino-based NFC technology** to provide smart healthcare services including digital health records, AI-assisted conversations, doctor and patient applications, and NFC-based patient identification.

---

# 📖 Overview

The **AI Smart Healthcare Management System with NFC Storage** is designed to modernize healthcare management by integrating Artificial Intelligence and NFC technology.

Patients can securely access their healthcare information using NFC cards, while doctors can manage appointments, prescriptions, and patient records through a dedicated application.

The project consists of multiple components working together:

- 👨‍⚕️ Doctor Application
- 📱 Patient Application
- 🤖 AI Chatbot
- 🌐 Express.js Backend
- 💳 NFC Hardware Module
- 🗄 Database Server

---

# ✨ Features

## 👨‍⚕️ Doctor Portal

- Patient Management
- Appointment Management
- Digital Prescriptions
- Medical History
- Patient Search

---

## 📱 Patient Application

- View Medical Records
- Book Appointments
- Prescription History
- Health Reports
- NFC Health Card

---

## 🤖 AI Chatbot

- Healthcare Assistance
- Symptom Suggestions
- General Health Information
- Patient Support

---

## 💳 NFC Healthcare Card

- NFC Patient Identification
- Quick Record Retrieval
- Secure Data Access
- Offline Card Verification

---

## 🛠 Backend

- REST API
- Patient Management
- Doctor Management
- Authentication
- Database Operations

---

# 📂 Project Structure

```text
AI-Smart-Healthcare-Management-System-with-NFC-Storage/
│
├── backend/
│   ├── data/
│   │   └── server.js
│   ├── chat_bot.py
│   └── ...
│
├── frontend/
│   └── apps/
│       ├── doctor/
│       └── newApp/
│
├── Hardware/
│   └── arduino/
│
├── package.json
└── README.md
```

---

# 🛠 Technology Stack

## Mobile

- React Native
- Expo

## Backend

- Node.js
- Express.js

## Artificial Intelligence

- Python
- Machine Learning
- NLP Chatbot

## Hardware

- Arduino
- NFC Module

## Database

- SQLite / MongoDB (Depending on deployment)

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/rahulrajancc/AI-Smart-Healthcare-Management-System-with-NFC-Storage.git

cd AI-Smart-Healthcare-Management-System-with-NFC-Storage
```

---

## Install Node Dependencies

```bash
npm install
```

Install frontend dependencies:

```bash
cd frontend/apps/doctor
npm install

cd ../newApp
npm install
```

Install backend dependencies:

```bash
cd ../../../backend
npm install
```

---

## Install Python Dependencies

```bash
pip install -r requirements.txt
```

or

```bash
pip install flask requests transformers torch nltk
```

---

# ▶️ Running the Project

## Start Backend

```bash
npm run backend
```

---

## Start AI Chatbot

```bash
npm run chatbot
```

---

## Start Doctor Application

```bash
npm run doctor
```

---

## Start Patient Application

```bash
npm run newapp
```

---

# 💳 NFC Hardware

The Arduino source code is located in:

```text
Hardware/
└── arduino/
```

This module is responsible for:

- Reading NFC Cards
- Sending Patient IDs
- Healthcare Card Authentication
- Hardware Communication

Upload the Arduino sketch using the **Arduino IDE**.

---

# 🔄 System Architecture

```text
                 NFC Card
                     │
                     ▼
              Arduino Reader
                     │
                     ▼
             Express Backend API
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
 AI Chatbot     Doctor App     Patient App
      │              │              │
      └──────────────┼──────────────┘
                     ▼
                Healthcare Database
```

---

# 📋 Available Scripts

| Command | Description |
|----------|-------------|
| `npm run backend` | Starts the Express backend server |
| `npm run chatbot` | Starts the AI chatbot |
| `npm run doctor` | Starts the Doctor React Native application |
| `npm run newapp` | Starts the Patient React Native application |

---

# 🎯 Future Improvements

- AI Disease Prediction
- Video Consultation
- Medicine Reminder
- Cloud Synchronization
- QR Code Integration
- Hospital Dashboard
- Multi-language Support
- Wearable Device Integration
- Electronic Health Record (EHR) Support

---

# 👨‍💻 Contributors

**Mangalam College of Engineering**

Department of Computer Science & Engineering

- Rahul Rajan
- Shone Varughese Mathew
- Santo Joseph Mathew

---

# 📜 License

This project was developed for **educational purposes** as part of the B.Tech Computer Science & Engineering curriculum.

---

# ⭐ Support

If you found this project useful, please consider giving it a ⭐ on GitHub.
