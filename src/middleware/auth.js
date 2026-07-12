require('dotenv').config();

const API_KEY = process.env.API_KEY;

function requireApiKey(req, res, next) {
  if (!API_KEY) {
    return next();
  }

  const authHeader = req.header('Authorization');
  const headerKey = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const apiKey = req.header('x-api-key') || headerKey;

  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'A valid API key is required to access this endpoint.',
      },
    });
  }

  next();
}

module.exports = { requireApiKey };
