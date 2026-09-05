/**
 * A plain Error carrying an HTTP status code, thrown by pure service
 * functions (services/*.js) that know nothing about Express. Controllers
 * catch nothing themselves (per the repo's asyncHandler convention) — they
 * set `res.status(err.statusCode || 500)` before rethrowing, or a thin
 * wrapper does it for them. See controllers/helpers.js#runService.
 */
class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

module.exports = HttpError;
