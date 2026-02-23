# Remote Android Repair & Diagnostic Suite (RADS)

A comprehensive web-based platform for mobile technicians to remotely diagnose, repair, and optimize Android devices. This project meets the SPPU (Savitribai Phule Pune University) MCA semester requirement of **16 forms** with a **MERN + Python + Java** technology stack.

## Project Overview

RADS bridges the gap between low-level system commands (ADB/Fastboot) and a high-level management interface, allowing technicians to:
- Remotely connect to client devices
- Run diagnostic commands
- Flash firmware
- Monitor device health in real-time

---

## 16-Form Structure

### 1. Technician Dashboard (8 Forms)

| # | Form Name | File Location |
|---|-----------|---------------|
| 1 | Technician Login | `client/src/pages/auth/Login.jsx` |
| 2 | Active Device Monitor | `client/src/pages/technician/ActiveDevices.jsx` |
| 3 | Device Specs View | `client/src/pages/technician/DeviceSpecs.jsx` |
| 4 | Terminal Console | `client/src/pages/technician/TerminalConsole.jsx` |
| 5 | Partition Health Manager | `client/src/pages/technician/PartitionHealth.jsx` |
| 6 | Firmware Library | `client/src/pages/technician/FirmwareLibrary.jsx` |
| 7 | Logcat Viewer | `client/src/pages/technician/LogcatViewer.jsx` |
| 8 | Repair History | `client/src/pages/technician/RepairHistory.jsx` |

### 2. Customer Portal (4 Forms)

| # | Form Name | File Location |
|---|-----------|---------------|
| 9 | Support Request | `client/src/pages/customer/SupportRequest.jsx` |
| 10 | Connection Wizard | `client/src/pages/customer/ConnectionWizard.jsx` |
| 11 | Live Repair Status | `client/src/pages/customer/LiveStatus.jsx` |
| 12 | Feedback & Rating | `client/src/pages/customer/Feedback.jsx` |

### 3. Admin Control (4 Forms)

| # | Form Name | File Location |
|---|-----------|---------------|
| 13 | User/Technician Management | `client/src/pages/admin/UserManagement.jsx` |
| 14 | Knowledge Base Manager | `client/src/pages/admin/KnowledgeBase.jsx` |
| 15 | System Audit Logs | `client/src/pages/admin/AuditLogs.jsx` |
| 16 | Analytics Dashboard | `client/src/pages/admin/Analytics.jsx` |

---

## Technology Stack

### MERN Stack (Frontend & API)
- **MongoDB** - Database for storing device logs, user data, firmware metadata
- **Express.js** - Node.js backend framework
- **React** - Frontend UI with Tailwind CSS
- **Node.js** - JavaScript runtime

### Python (Automation Engine)
- **Log Parser** - Parses logcat outputs
- **Device Analyzer** - Identifies error patterns (EMMC failure, corrupted partitions)
- **Subprocess Module** - Executes ADB/Fastboot commands

### Java Spring Boot (Control Core)
- **WebSocket** - Real-time device communication
- **REST API** - Command relay between UI and client
- **Security** - Enterprise-grade authentication

---

## Project Structure

```
RADS/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── layouts/           # Dashboard, Customer, Admin layouts
│   │   ├── pages/             # All 16 forms
│   │   │   ├── auth/          # Login, Register
│   │   │   ├── technician/    # 8 technician forms
│   │   │   ├── customer/      # 4 customer forms
│   │   │   └── admin/         # 4 admin forms
│   │   ├── context/           # React Context for auth
│   │   ├── App.jsx            # Main router
│   │   └── main.jsx           # Entry point
│   ├── package.json           # React dependencies
│   ├── tailwind.config.js     # Tailwind CSS config
│   └── vite.config.js         # Vite config
│
├── server/                    # Node.js Backend
│   ├── index.js               # Express server
│   ├── models/                # MongoDB schemas
│   ├── routes/                # API routes
│   └── package.json           # Server dependencies
│
├── python-service/           # Python Automation
│   ├── log_parser.py          # Logcat parser
│   └── device_analyzer.py     # Device analysis
│
├── java-service/              # Java Spring Boot
│   ├── pom.xml                # Maven dependencies
│   └── src/
│       └── main/java/com/rads/
│           ├── RadsApplication.java
│           ├── controller/    # REST controllers
│           └── websocket/     # WebSocket handlers
│
└── README.md                  # This file
```

---

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- Python (v3.8+)
- Java JDK 17
- MongoDB
- Android SDK (ADB & Fastboot)

### Frontend Setup
```
bash
cd client
npm install
npm run dev
```

### Backend Setup (Node.js)
```
bash
cd server
npm install
# Update MongoDB URI in index.js
npm start
```

### Python Service
```
bash
cd python-service
pip install -r requirements.txt
python log_parser.py
```

### Java Service
```
bash
cd java-service
mvn clean install
mvn spring-boot:run
```

---

## Features

### Technician Features
- Real-time device monitoring
- ADB/Fastboot command execution
- Firmware library management
- Logcat streaming
- Partition health visualization

### Customer Features
- Easy support request submission
- Step-by-step connection wizard
- Live repair progress tracking
- Post-repair feedback

### Admin Features
- User & technician management
- Knowledge base content management
- Comprehensive audit logs
- Analytics and reporting

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Devices
- `GET /api/devices` - Get all devices
- `POST /api/devices` - Add new device

### Repairs
- `GET /api/repairs` - Get all repair requests
- `POST /api/repairs` - Create repair request
- `PUT /api/repairs/:id` - Update repair status

### Analytics
- `GET /api/analytics` - Get system analytics

---

## System Architecture

```
[React UI] <---> [Node.js API] <---> [MongoDB]
                        |
                        v
                [Java Spring Boot]
                        |
                        v
                [Python Service]
                        |
                        v
                [ADB/Fastboot]
                        |
                        v
                [Android Device]
```

---

## License

This project is for educational purposes as an MCA final semester project.

---

## Author

Created for SPPU MCA Semester Project Requirement: **16 Forms + MERN + Python + Java**
