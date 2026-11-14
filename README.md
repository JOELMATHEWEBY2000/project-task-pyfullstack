"# project-task-pyfullstack" 

# ProjectFlow -- Project & Task Management System

A full-stack project and task management application using Django REST
Framework, React + Vite, JWT authentication, and SQLite for local
development / PostgreSQL for production.

-   **Repository:**
    https://github.com/JOELMATHEWEBY2000/project-task-pyfullstack
-   **Frontend:** https://project-task-pyfullstack.vercel.app
-   **Backend:** https://project-task-backend-hy2n.onrender.com

## Technology stack

  Layer            Technology
  ---------------- ---------------------------------------------------------
  Frontend         React, Vite, JavaScript, Bootstrap, Axios, React Router
  Backend          Python, Django, Django REST Framework
  Authentication   JWT / SimpleJWT
  Database         SQLite locally; PostgreSQL for hosted production
  Containers       Docker, Docker Compose
  Hosting          Vercel frontend; Render backend and PostgreSQL

## Features

-   JWT authentication and authenticated API requests.
-   Role-based access for administrators, managers, and employees.
-   Project creation, editing, deletion, status, and date management.
-   Team creation and team-member management.
-   Task creation and management.
-   Assign a team directly to a task, independently of project-team
    membership.
-   Task priority and status tracking.
-   Search, filters, pagination, and CSV export in the task interface.

Backend permissions remain authoritative; hiding a frontend control is
not a substitute for API authorization.

## Architecture

``` text
Browser
  |
  v
React + Vite (Vercel)
  | HTTPS API requests with JWT
  v
Django REST Framework (Render)
  |
  v
PostgreSQL (Render)

Local development may use SQLite.
```

## Repository structure

``` text
project-task-pyfullstack/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── config/
│   ├── accounts/
│   ├── projects/
│   ├── teams/
│   └── tasks/
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   └── src/
├── docker-compose.yml
└── README.md
```

## Prerequisites

-   Python 3.12 recommended for a consistent backend environment.
-   Node.js 22 and npm.
-   Git.
-   Docker Desktop (optional).

## Local setup

### 1. Clone

``` bash
git clone https://github.com/JOELMATHEWEBY2000/project-task-pyfullstack.git
cd project-task-pyfullstack
```

### 2. Backend

``` bash
cd backend
python -m venv venv
```

Activate on Windows:

``` powershell
venv\Scripts\activate
```

Install dependencies and prepare the database:

``` bash
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Backend: `http://127.0.0.1:8000/`\
Django Admin: `http://127.0.0.1:8000/admin/`

### 3. Frontend

In a second terminal:

``` bash
cd frontend
npm install
npm run dev
```

Vite: `http://localhost:5173/`

### 4. Frontend API URL

Create `frontend/.env.local`:

``` env
VITE_API_URL=http://127.0.0.1:8000/api/
```

Configure the Axios client to use:

``` javascript
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/",
});
```

Retain the project's JWT request interceptor, which sends the access
token as `Authorization: Bearer <token>`.

## Environment variables

### Backend

Configure these in the backend hosting service:

  Variable                 Purpose
  ------------------------ ------------------------------------------
  `SECRET_KEY`             Private Django secret key
  `DEBUG`                  Set to `False` in production
  `DATABASE_URL`           PostgreSQL connection URL
  `CORS_ALLOWED_ORIGINS`   Comma-separated allowed frontend origins
  `CSRF_TRUSTED_ORIGINS`   Comma-separated trusted HTTPS origins

Example (replace placeholders with actual values):

``` env
DEBUG=False
DATABASE_URL=<private-postgresql-connection-url>
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
CSRF_TRUSTED_ORIGINS=https://your-frontend.vercel.app
```

Never commit secret keys, passwords, or database URLs. Vite `VITE_`
variables are public in the browser bundle; use them only for non-secret
configuration.

### Frontend on Vercel

``` env
VITE_API_URL=https://your-backend.onrender.com/api/
```

## API routes

The Django URL configuration in this project exposes these route groups:

  Route                         Purpose
  ----------------------------- -------------------------------
  `/api/auth/login/`            Obtain JWT tokens
  `/api/auth/refresh/`          Refresh an access token
  `/api/auth/`                  Account-related routes
  `/api/admin/`                 Administrative account routes
  `/api/projects/`              Projects API
  `/api/teams/`                 Teams API
  `/api/available-employees/`   Available employee list
  `/api/tasks/`                 Tasks API
  `/admin/`                     Django administration

Most API operations require authentication. Include:

``` http
Authorization: Bearer <access-token>
```

Exact methods and role permissions are determined by the backend views,
serializers, and permission classes.

## Docker

From the repository root:

``` bash
docker compose build
docker compose up -d
docker compose exec backend python manage.py migrate
docker compose ps
docker compose logs -f
```

Stop containers:

``` bash
docker compose down
```

The development ports are normally frontend `5173` and backend `8000`.
The browser should call the backend through a browser-accessible URL
such as `http://localhost:8000`, not a Docker Compose service hostname.

Use PostgreSQL for hosted production data. Do not rely on an ephemeral
container filesystem for durable database storage.

## Deployment

### Render backend using Docker

1.  Push the repository to GitHub.
2.  Create a Render Web Service connected to the repository.
3.  Select Docker runtime.
4.  Configure the Dockerfile path and context to match the repository
    layout. For a repository-root service, these are typically
    `./backend/Dockerfile` and `./backend`.
5.  Configure `SECRET_KEY`, `DEBUG=False`, `DATABASE_URL`,
    `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS`.
6.  Ensure Gunicorn binds to Render's supplied port:

``` bash
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

7.  Attach the Render PostgreSQL database. Use its internal URL when the
    database and backend are in the same region.
8.  Deploy and inspect runtime logs.

If Django settings enable WhiteNoise, ensure `whitenoise` is in
`backend/requirements.txt`. Also include the packages actually used by
the settings and database configuration, such as Gunicorn,
`dj-database-url`, and a PostgreSQL driver.

### Vercel frontend

1.  Import the GitHub repository into Vercel.
2.  Set Root Directory to `frontend`.
3.  Select Vite.
4.  Build command: `npm run build`.
5.  Output directory: `dist`.
6.  Set `VITE_API_URL` to the deployed Render API URL ending in `/api/`.
7.  Deploy.
8.  Add the exact Vercel origin to the backend CORS and CSRF
    trusted-origin settings.

For React Router client-side routes, create `frontend/vercel.json` if
needed:

``` json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Redeploy the frontend after changing Vite environment variables.

## Database migration notes

SQLite data is not automatically copied into a newly created PostgreSQL
database. If existing users, projects, teams, and tasks must be
preserved, export and import the data as a separate migration task. Back
up production data and keep credentials private.

## Troubleshooting

### Backend root URL returns 404

The root path `/` may not have a configured route. Test `/admin/` or the
API routes instead. A root 404 alone does not mean the server is
offline.

### CORS errors

Check the exact deployed frontend origin, including `https://`, in
`CORS_ALLOWED_ORIGINS`. Redeploy the backend after changing environment
variables.

### `ModuleNotFoundError: No module named 'whitenoise'`

If WhiteNoise middleware is enabled, add `whitenoise` to
`backend/requirements.txt`, commit, and redeploy.

### Gunicorn startup failure

Read the full Render runtime traceback. Check the WSGI module path,
dependencies, environment variables, database connection, and allowed
hosts.

### Task team validation error

If task teams are intended to be independent of projects, the task
serializer must not require the selected team to be present in
`project.teams`.

## Security checklist

-   [ ] `DEBUG=False` in production.
-   [ ] Strong private `SECRET_KEY`.
-   [ ] Database credentials stored only in backend environment
    variables.
-   [ ] CORS restricted to trusted frontend origins.
-   [ ] HTTPS enabled for deployed services.
-   [ ] Backend permissions enforced on protected API endpoints.
-   [ ] Production database backed up.
-   [ ] `.env` files and secrets excluded from Git.

## License

Add a LICENSE file and specify the intended license before distributing
the project.
