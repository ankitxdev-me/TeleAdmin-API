const express = require('express');
const router = express.Router();
const { parseTarget } = require('../utils/validator');
const { fetchAdmins } = require('../services/telegramService');

router.get('/', async (req, res) => {
  // Validate target
  const parsed = parseTarget(req.query.target);
  if (!parsed.valid) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_TARGET',
        message: parsed.error,
      },
    });
  }

  try {
    const result = await fetchAdmins(parsed.username);

    // Forward structured errors from the Python service
    if (!result.success) {
      const statusCode = result.error?.code === 'CHANNEL_NOT_SUPPORTED' ? 400
        : result.error?.code === 'GROUP_NOT_FOUND' ? 404
        : result.error?.code === 'NOT_AUTHENTICATED' ? 503
        : 500;

      return res.status(statusCode).json(result);
    }

    return res.json(result);
  } catch (err) {
    // Telethon service unreachable
    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
      return res.status(503).json({
        success: false,
        error: {
          code: 'TELETHON_UNAVAILABLE',
          message: 'The Telethon service is not running. Start it with: npm run start:telethon',
        },
      });
    }

    console.error('[admins] Unexpected error:', err.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
      },
    });
  }
});

router.post('/bulk', async (req, res) => {
  const targets = req.body?.targets;

  if (!Array.isArray(targets) || targets.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'The request body must contain a non-empty array of targets.',
      },
    });
  }

  if (targets.length > 20) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'TOO_MANY_TARGETS',
        message: 'Maximum bulk request size is 20 targets per request.',
      },
    });
  }

  const results = await Promise.all(targets.map(async (target) => {
    const parsed = parseTarget(target);
    if (!parsed.valid) {
      return {
        target,
        success: false,
        error: {
          code: 'INVALID_TARGET',
          message: parsed.error,
        },
      };
    }

    try {
      const result = await fetchAdmins(parsed.username);
      return {
        target,
        ...result,
      };
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
        return {
          target,
          success: false,
          error: {
            code: 'TELETHON_UNAVAILABLE',
            message: 'The Telethon service is not running. Start it with: npm run start:telethon',
          },
        };
      }

      return {
        target,
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred.',
        },
      };
    }
  }));

  return res.json({
    success: true,
    results,
  });
});

module.exports = router;
