# API Status Codes

Standard HTTP status codes used across the API:

| Code | Usage |
|------|-------|
| 200 | Success (GET, PUT, PATCH, DELETE with response body) |
| 201 | Resource created (POST) |
| 400 | Validation error (invalid input, bad UUID) |
| 401 | Unauthenticated (missing or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Resource not found |
| 500 | Internal server error |
| 501 | Not implemented |
| 503 | Service unavailable (e.g. DB unreachable) |

Create operations (POST) return 201. Health check returns 503 when DB is unreachable.
