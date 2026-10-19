
# HireFlow ATS — Applicant Tracking System

HireFlow ATS is a full-stack Applicant Tracking System designed to help recruiters manage candidates, job openings, and applications through a centralized dashboard. It provides candidate and job management, application-stage tracking, search functionality, and real-time dashboard metrics backed by a MySQL database.

## 🚀 Live Demo

- **Frontend:** https://mini-applicant-tracking-system-ats.vercel.app
- **Backend API:** https://hireflow-ats-api-fresh.vercel.app
- **API Health Check:** https://hireflow-ats-api-fresh.vercel.app/api/health
- **GitHub Repository:** https://github.com/Shreyavk28/Mini-Applicant-Tracking-System-ATS-

## ✨ Features

### 1. Dashboard
- View total candidates, jobs, and applications.
- Monitor applications grouped by recruitment stage.
- Access recruitment information from a centralized dashboard.

### 2. Candidate Management
- Add new candidates.
- View candidate records.
- Edit candidate information.
- Delete candidates.
- Search and filter candidate records where supported by the interface.

### 3. Job Management
- Create job openings.
- View available jobs.
- Edit job details.
- Delete job postings.

### 4. Application Management
- Manage candidate applications.
- Track applications through recruitment stages.
- Update application stages.
- Keep application records synchronized with the database.

### 5. Search and Filtering
- Find relevant candidates and records using the available search functionality.
- Navigate recruitment data more efficiently.

### 6. Persistent Database
- Store candidates, jobs, and applications in MySQL.
- Preserve changes across page refreshes.
- Use a remotely hosted Aiven MySQL database with SSL enabled.

## 🛠️ Technology Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
- JavaScript
- Fetch/API integration

### Backend
- Node.js
- Express.js
- REST API
- CORS
- dotenv

### Database
- MySQL
- Aiven Cloud MySQL
- mysql2
- SSL/TLS database connection

### Deployment and Tools
- Vercel — frontend and backend deployment
- Git and GitHub — version control
- Visual Studio Code — development environment

## 🏗️ Project Structure

```text
Mini-Applicant-Tracking-System-ATS/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vercel.json
│   ├── package.json
│   └── index.html
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── routes/
│   │   │   ├── candidates.js
│   │   │   ├── jobs.js
│   │   │   └── applications.js
│   │   └── server.js
│   ├── certs/
│   │   └── ca.pem
│   ├── index.js
│   └── package.json
│
├── .gitignore
└── README.md
```

*Note: The structure above represents the main project files. Your local folder may contain additional files.*

## ⚙️ Getting Started

Follow these steps to run the project locally.

### Prerequisites

Install the following:

- Node.js and npm
- MySQL database or an accessible MySQL instance
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Shreyavk28/Mini-Applicant-Tracking-System-ATS-.git
cd Mini-Applicant-Tracking-System-ATS-
```

### 2. Configure the backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server/` directory.

Add the following variables using your own database credentials:

```env
PORT=5000

DB_HOST=your_mysql_host
DB_PORT=your_mysql_port
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=defaultdb
DB_SSL=true

CLIENT_URL=http://localhost:5173
```

**Important:**
- Replace the database placeholders with your own MySQL connection details.
- Use `DB_SSL=true` when connecting to a database that requires SSL.
- Ensure the required CA certificate is available at `server/certs/ca.pem` when SSL is enabled.
- Never commit your `.env` file or database credentials to GitHub.

Start the backend:

```bash
npm run dev
```

The API should be available at:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

### 3. Configure the frontend

Open a second terminal from the project root:

```bash
cd client
npm install
```

Create a `.env` file inside `client/` if required by your local frontend configuration.

For local development, configure the frontend API base URL to point to the backend:

```env
VITE_API_URL=http://localhost:5000/api
```

If the frontend already uses a different API configuration, keep it consistent with the existing application code.

Start the frontend:

```bash
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173
```

## 🔗 API Endpoints

The deployed backend base URL is:

```text
https://hireflow-ats-api-fresh.vercel.app
```

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check API and database health |
| GET | `/api/candidates` | Retrieve candidates |
| POST | `/api/candidates` | Create a candidate |
| GET | `/api/jobs` | Retrieve jobs |
| POST | `/api/jobs` | Create a job |
| GET | `/api/applications` | Retrieve applications |
| POST | `/api/applications` | Create an application |
| GET | `/api/dashboard` | Retrieve dashboard metrics |
| PUT | `/api/applications/:id/stage` | Update an application's stage |

Additional supported routes may be available for updating or deleting candidates, jobs, and applications.

## 🗄️ Database

The application uses MySQL to store recruitment data, including:

- `candidates`
- `jobs`
- `applications`

The backend connects to the configured MySQL database through a connection pool. In production, the database is hosted on Aiven and accessed over an SSL-enabled connection.

## 🌐 Deployment

The application is deployed using Vercel.

- **Frontend:** React application deployed on Vercel.
- **Backend:** Express API deployed on Vercel.
- **Database:** Aiven Cloud MySQL.
- **API routing:** Frontend rewrite configuration forwards `/api/*` requests to the deployed backend.

Production environment variables are configured in the Vercel project settings rather than committed to the repository.

## 🔒 Security

- Store sensitive credentials in environment variables.
- Keep `.env` files out of version control.
- Use SSL/TLS for the production database connection.
- Restrict CORS to trusted frontend origins.
- Never publish database passwords or private credentials in documentation.

## 🧪 Testing

The following workflows have been tested in the deployed application:

- Backend health check and database connectivity.
- Candidate creation and management.
- Job creation and management.
- Application-stage updates.
- Dashboard metrics.
- Data persistence after refreshing the website.

## 🎯 Project Objective

HireFlow ATS demonstrates full-stack application development by combining a responsive React frontend, RESTful APIs built with Express, and persistent MySQL storage. It provides a practical foundation for managing recruitment workflows in one application.

## 👩‍💻 Author

**Shreya V K**

- GitHub: https://github.com/Shreyavk28
- Project: [HireFlow ATS](https://mini-applicant-tracking-system-ats.vercel.app)

---

Built with React, Node.js, Express, and MySQL.
