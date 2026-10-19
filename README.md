
# HireFlow ATS — Mini Applicant Tracking System

HireFlow ATS is a web-based Applicant Tracking System (ATS) designed to help recruiters manage candidates, track recruitment progress, search candidate records, and monitor hiring activities through a centralized dashboard.

This project was developed as a Mini Applicant Tracking System assignment for the Full Stack Developer Intern role at EarlyJobs.ai.

## Features

### 1. Dashboard
- View total candidates and applications.
- Monitor applications across different hiring stages.
- View recent applications and candidate activity.
- Get a quick overview of recruitment progress.

### 2. Candidate Management
- Add new candidate records.
- View candidate information.
- Edit candidate details.
- Delete candidate records.
- Organize candidate information in one place.

### 3. Application and Hiring Pipeline
- Manage applications associated with candidates and jobs.
- Track application progress through hiring stages.
- View application status and related information.
- Monitor hiring-stage counts through the dashboard.

### 4. Search
- Search candidate records.
- Find relevant information more efficiently.

### 5. Job Management
- View available job openings.
- Add new jobs.
- Edit existing job details.
- Delete job openings.
- Store job title, department, location, and employment type.

## Technology Stack

### Frontend
- React.js
- Tailwind CSS
- JavaScript
- Vite

### Backend
- Node.js
- Express.js
- REST API

### Database
- MySQL

## Project Structure

```text
HireFlow-ATS/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── ...
│   ├── package.json
│   └── ...
├── server/
│   ├── src/
│   │   ├── routes/
│   │   └── ...
│   ├── package.json
│   └── ...
├── .gitignore
└── README.md
```

The exact internal structure may vary depending on the implementation.

## Prerequisites

Install the following before running the project:

- Node.js and npm
- MySQL Server
- Git

## Installation and Setup

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_PROJECT_FOLDER>
```

Replace the placeholders with your actual repository URL and project folder.

### 2. Set up the backend

```bash
cd server
npm install
```

Configure the environment variables required by your backend.

If your project provides an example environment file, copy it and update the values:

```bash
# Windows PowerShell
Copy-Item .env.example .env
```

Example environment configuration:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=hireflow_ats
```

These are example variable names. Use the exact names expected by your backend code.

Create the required MySQL database and tables according to your project's schema or SQL setup scripts.

Start the backend:

```bash
npm run dev
```

If the project does not define a development script, check `server/package.json` for the available start command.

### 3. Set up the frontend

Open another terminal from the project root:

```bash
cd client
npm install
npm run dev
```

Open the local URL printed by Vite in the terminal.

### 4. Verify the application

- Confirm the backend starts without database connection errors.
- Confirm the frontend can communicate with the backend.
- Add and manage candidates.
- Create and update applications.
- Test hiring-stage tracking.
- Test search and dashboard metrics.
- Verify job management and data persistence.

## Environment Variables

Do not commit actual secrets to GitHub.

Typical backend configuration may include:

| Variable | Purpose |
|---|---|
| `PORT` | Backend server port |
| `DB_HOST` | MySQL host |
| `DB_PORT` | MySQL port |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name |

The variable names above are examples. Check your server configuration to confirm the actual names used by the project.

## API

The backend exposes REST API endpoints for the application's resources.

Typical operations include:

- Retrieve candidate records.
- Create, update, and delete candidates.
- Retrieve and manage applications.
- Track application stages.
- Retrieve, create, update, and delete jobs.
- Check application or server health, if configured.

Refer to the backend route files for the exact endpoint paths, HTTP methods, request bodies, and response formats.

## Security Notes

- Store database credentials in environment variables.
- Keep `.env` files out of version control.
- Validate incoming API requests.
- Handle errors without exposing secrets.
- Use appropriate database permissions.
- Configure CORS for the intended frontend origin when deploying.

## Future Improvements

Possible enhancements include:

- Advanced candidate filtering.
- Resume upload and management.
- Interview scheduling.
- Recruitment activity reports.
- Role-based recruiter access.
- Email notifications.
- Automated deployment and testing.

These are potential future improvements and may not be implemented in the current version.

## Assignment Deliverables

For the EarlyJobs.ai assignment, prepare:

1. The deployed application URL.
2. The GitHub repository URL.
3. A short demonstration video showing the core features.

Add the actual links here when they are ready:

- **Live Demo:** Add your deployed application URL
- **GitHub Repository:** Add your repository URL
- **Demo Video:** Add your video URL

## Author

**Shreya V K**

GitHub: [Shreyavk28](https://github.com/Shreyavk28)

LinkedIn: [Shreya V K](https://linkedin.com/in/shreya-vk-softwareengineer)

## License

This project was created for learning and assignment purposes. Add a license file if you intend to distribute the project under a specific open-source license.
