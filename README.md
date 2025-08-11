# RealG (Realtime Emergency Alert & Location Geofencing)

![RealG Logo](src/assets/logo.png)

## Overview

This project is a comprehensive construction safety monitoring system. It provides a real-time dashboard to monitor various aspects of a construction site, including CCTV feeds, worker attendance, and safety alerts. The system uses a machine learning model to detect safety violations from CCTV streams, such as the absence of personal protective equipment (PPE).

## Features

*   **Real-time Dashboard**: A central dashboard to view all monitoring data in one place.
*   **CCTV Monitoring**: Live monitoring of construction sites using CCTV cameras.
*   **AI-Powered Safety Detection**: A YOLO-based machine learning model to detect:
    *   PPE violations (e.g., no hardhat, no mask, no safety vest).
    *   Intrusion into restricted areas.
    *   Potential accidents.
*   **Worker Tracking**: Track worker locations and attendance.
*   **Alert System**: Real-time alerts for safety violations, SOS signals, and geofence breaches.
*   **History and Reporting**: View historical data and generate reports.

## Tech Stack

**Frontend:**

*   React
*   TypeScript
*   Vite
*   Tailwind CSS
*   Chart.js

**Backend:**

*   **Node.js Server:**
    *   Express.js
    *   MySQL2
*   **Python Server:**
    *   Flask
    *   Flask-SocketIO
    *   Ultralytics (YOLO)
    *   OpenCV
    *   ONNX Runtime

**Database:**

*   MySQL

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js and npm
*   Python 3.8+ and pip
*   MySQL

### Installation

1.  **Clone the repo**
    ```sh
    git clone https://github.com/your_username/your_project.git
    ```
2.  **Frontend Setup**
    ```sh
    # Go to the project root directory
    npm install
    ```
3.  **Backend Setup**

    *   **Node.js Server**
        ```sh
        cd backend
        npm install
        ```
    *   **Python Server**
        ```sh
        cd backend
        pip install -r requirements.txt
        ```

### Database Setup

1.  Create a MySQL database.
2.  Create an `attendance` table with the following schema:
    ```sql
    CREATE TABLE attendance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uid VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ```

### Environment Variables

The Node.js server requires a `.env` file in the `backend` directory with the following variables:

```
MYSQLHOST=your_database_host
MYSQLUSER=your_database_user
MYSQLPASSWORD=your_database_password
MYSQLDATABASE=your_database_name
MYSQLPORT=your_database_port
```

### Running the Application

1.  **Start the Node.js server**
    ```sh
    cd backend
    npm start
    ```
    The server will run on `http://localhost:3000`.

2.  **Start the Python server**
    ```sh
    cd backend
    python app.py
    ```
    The server will run on `http://localhost:5000`.

3.  **Start the frontend development server**
    ```sh
    # In the project root directory
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

**Note:** The path to the YOLO model in `backend/app.py` is hardcoded. You may need to update it to the correct path on your local machine.

```python
# backend/app.py
model = YOLO('path/to/your/best_yolo11x.pt')
```
