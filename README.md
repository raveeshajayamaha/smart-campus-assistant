# AI-Powered Smart Campus Assistant

React + TypeScript + Vite frontend; Express + Mongoose backend. Existing dashboard and assistant styles are preserved. Campus chat uses MongoDB records with deterministic keyword matching; no paid AI key is needed.

## Run locally

Use Node.js 22.12+ (or another version supported by the installed Vite). From the project root:

```powershell
npm install
cd backend
npm install
# Only if .env does not exist: copy .env.example .env
# Set MONGO_URI in backend/.env to your running MongoDB or Atlas connection string.
npm run seed
npm run dev
```

In a second terminal from the project root:

```powershell
npm run dev
```

Frontend: http://localhost:5173. Backend: http://localhost:5000. Vite proxies `/api` to port 5000. Never put MongoDB credentials in frontend files. For a production deployment serve the frontend with a reverse proxy forwarding `/api` to Express; `vite preview` also proxies `/api` locally.

## Demo data and administrator

`cd backend; npm run seed` tops up the five campus collections to the sample counts (3 events, 3 announcements, 3 schedules, 3 resources, 4 locations), preserving existing records. It skips existing sample titles/subjects/names and does not run at server startup. Sample dates are relative to when seeding runs; edit expired dates in Admin for a later demo. All sample campus facts are fictional and should be replaced with real institution data.

Register an account in the UI, then explicitly promote it locally:

```powershell
cd backend
npm run make-admin -- your-email@example.com
```

Log in again. Public registration always creates students even if an admin role is submitted. Existing users retain their roles. Login returns a random 24-hour bearer session token stored locally; only its SHA-256 hash is stored in MongoDB. All protected pages verify the server session. Admin writes verify the database user role. Logout revokes the server session and clears local authentication; when offline, it clears local authentication and the server token expires within 24 hours. Accounts logged in before sessions were added must log in again.

## APIs

- `POST /api/auth/register`, `POST /api/auth/login` (public)
- `GET /api/auth/me`, `POST /api/auth/logout` (authenticated)
- `GET /api/events` (public, preserves existing event integration)
- `GET /api/announcements`, `/api/schedules`, `/api/library`, `/api/locations` (authenticated)
- `POST /api/events`, `/api/announcements`, `/api/schedules`, `/api/library`, `/api/locations` (admin)
- `PUT /api/{events|announcements|schedules|library|locations}/:id` (admin, partial updates)
- `DELETE /api/{events|announcements|schedules|library|locations}/:id` (admin)
- `POST /api/assistant/chat` with `{ "message": "When is my next class?" }` (authenticated)
- `GET /api/test` health response

Send `Authorization: Bearer <login token>` on authenticated requests. List response keys are `events`, `announcements`, `schedules`, `resources`, `locations`. Validation failures return 400, missing records 404, missing/expired login 401, student writes 403. Schedule times use 24-hour `HH:mm`, end after start. Dates represent campus calendar dates. The assistant interprets class times in Asia/Colombo, excludes past classes and events, and lists no more than five matching records per topic.

REST Client examples: `backend/test.http`. Copy a token from login and a record ID to its variables. Each POST in this file creates a record; the seed script is the repeatable demo-data option.

## Frontend

Protected routes: `/student-dashboard`, `/assistant`, `/events`, `/announcements`, `/academic`, `/library`, `/locations`, `/profile`; `/admin-dashboard` additionally requires admin. Sidebar and quick actions navigate to these routes. Campus lists support search, loading, empty and error states. Admin supports list/add/edit/delete for all five collections. Dashboard announcements and timetable use MongoDB. Chat supports Enter, send, suggested/popular topics, session-local recent questions, pending state and retry after errors. Dashboard search carries a question to the assistant input. Profile shows account details; contact faculty to change details.

## Verification

```powershell
npm run build
npm run lint
cd backend
npm test
```

Integration tests require the configured MongoDB server and create a uniquely named `campus_test_<random>` database. They clean their own records and users without dropping any database or touching project data. Empty test collections can remain. With both development servers running, `node tests/browser-smoke.cjs` from `backend` also checks the actual UI using installed Windows Chrome and cleans its temporary account and announcement. Its browser profile and dashboard screenshot are kept in the system temporary directory. Tests cover registration, student/admin roles, sessions, all collection CRUD, validation, missing records, assistant data lookup, expiry and logout.

## Scope

Timetables are shared campus demo information, not individualized course enrollment. Chat is rule based, not a general language model, and does not persist conversations. No external map, file uploads, event registration, password reset or production abuse throttling is included. Seed content and campus opening hours are demonstration data.
