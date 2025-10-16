# LexiFlow Go Backend

This service provides account registration and authentication endpoints used by the front-end application. User
registrations are stored in PostgreSQL and passwords are hashed with bcrypt.

## Configuration

| Environment variable | Description | Default |
|----------------------|-------------|---------|
| `PORT` | HTTP port | `8080` |
| `DATABASE_URL` | PostgreSQL DSN | `postgres://lexiflow:lexiflow@localhost:5432/lexiflow?sslmode=disable` |
| `CORS_ORIGINS` | Comma-separated list of allowed origins | `http://localhost:5173,http://localhost:3000` |

## Endpoints

All routes are prefixed with `/api/v1`.

- `POST /auth/register` – create an account (`companyName`, `email`, `password`, optional `plan`).
- `POST /auth/login` – authenticate with `email` and `password`.
- `POST /auth/verify-email` – mark an account as verified (accepts `email`/`code`).
- `POST /auth/subscription` – update the stored subscription plan.
- `GET /healthz` – simple health check.

Each auth endpoint returns a payload with a `user` object containing id, company name, email, verification status,
subscription, and creation timestamp.

## Running locally

```bash
# start postgres + backend + frontend
cd ../
docker compose up --build
```

To run without Docker:

```bash
export DATABASE_URL="postgres://lexiflow:lexiflow@localhost:5432/lexiflow?sslmode=disable"
export PORT=8080
cd backend
go run ./...
```

Make sure PostgreSQL is running and the database/user found in `DATABASE_URL` exist before starting the server.

## Future work

The Go service is intentionally modular so that Python-based inference components can be added alongside Go handlers in
future iterations. Shared persistence lives in PostgreSQL while compute-heavy inference pipelines can call back into the
Go API once those models are ready.
