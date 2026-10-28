# Verification

Verified on October 28, 2026 with Node.js 24.22.1.

| Check | Result |
| --- | --- |
| `npm test --prefix backend` | Passed: 7 test groups, 0 failures |
| `npm test --prefix frontend` | Passed: React integration against real HTTP API and SQLite |
| `npm run build --prefix frontend` | Passed: Vite production assets generated |
| Backend production dependency audit | 0 known vulnerabilities reported |
| Frontend dependency audit, including test dependencies | 0 known vulnerabilities reported |
| Real browser and responsive visual inspection | Not completed; browser executable unavailable and download failed |
| GitHub upload / hosted deployment | Not performed; instructions and configuration included |

## Verified user story

Registration → signed-in dashboard → task creation → edit → completion → Pending and Completed filters → delete cancellation → delete confirmation → logout → login.

The frontend integration test executes the actual React components in Happy DOM, uses actual HTTP requests against Express, checks the resulting SQLite rows, and checks the rendered interface after responses. The dialog opening/closing methods are simulated; this does not verify native browser focus trapping, layout, mobile rendering, or accessibility.

The backend tests separately cover password hashing, duplicate registration, invalid login, JWT validation and expiry, protected profile responses, task validation, task CRUD, status filtering, ownership isolation for read/update/delete, CORS, and persistence using a second SQLite connection to the same on-disk file.

Test databases are temporary; the delivered project includes no real accounts, passwords, or task database. Rerun the commands after installing both frontend and backend dependencies. Perform the README's manual UI checklist in a real browser before submitting or deploying.
