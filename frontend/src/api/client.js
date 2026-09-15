// Base URL: in dev, hits the Vite proxy (/api -> localhost:8000) so cookies
// are same-origin and CORS never comes up. In prod, set VITE_API_BASE_URL.
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Normalizes FastAPI's two error body shapes into a single flat message
 * and keeps the raw detail around for cases that need it (e.g. 423's
 * locked_until).
 *   - 422 validation errors: { detail: [{ loc, msg, type }, ...] }
 *   - explicit HTTPExceptions: { detail: "message" } or { detail: {...} }
 */
export async function parseErrorBody(response) {
  let body = null;
  try {
    body = await response.json();
  } catch {
    // no JSON body (e.g. plain 500) - fall through with body = null
  }

  const detail = body?.detail;
  let message = `Request failed (${response.status})`;

  if (Array.isArray(detail)) {
    // 422 Pydantic validation errors
    message = detail.map((e) => e.msg).filter(Boolean).join('; ') || message;
  } else if (typeof detail === 'string') {
    message = detail;
  } else if (detail && typeof detail === 'object') {
    // e.g. 423 locked account: { message: "...", locked_until: "..." }
    message = detail.message || message;
  }

  return { status: response.status, message, detail, body };
}

/**
 * A tagged error carrying the parsed API error info so callers can
 * branch on status/detail without re-parsing the response.
 */
export class ApiError extends Error {
  constructor({ status, message, detail, body }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.body = body;
  }
}

export function buildUrl(path) {
  return `${API_BASE}${path}`;
}