# PCRMS: Police Records & Criminal Management System

DBMS course project. MySQL + Node/Express API + React (Vite) frontend.

```
database/   schema.sql, programmability.sql (views/procedures/triggers), seed.sql, queries.sql, ER diagram, normalization notes
server/     Express REST API (JWT auth, role-based access)
client/     React UI
```

## Run it
Requires Node 18+ and MySQL 8+.

```bash
cd server
cp .env.example .env        # set DB_PASSWORD
npm install
npm run setup-db            # creates the pcrms database, sample data, demo users
npm start                   # API on :4000
```
```bash
cd client
npm install
npm run dev                 # UI on http://localhost:5173
```

Demo logins: `admin/admin123` (full), `officer/officer123` (no delete), `viewer/viewer123` (read only).

## Team
G Nikhil Sreenivas (25BCE0178), Aryan Menon (25BCE0327), Arpit Karna (25BCE2887), Thota Manoj Sai Kumar (25BAI0021)

## Tests
With the API running and a freshly seeded database (`npm run setup-db` in `server/`):

```bash
cd server && node tests/run-tests.js results.json
```

44 API and database test cases (authentication, roles, CRUD, validation, procedures, triggers, reports). The project report is in `report/`.
