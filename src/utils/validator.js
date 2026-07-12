/**
 * Normalizes and validates the target input.
 * Accepts: @username or https://t.me/username
 * Returns: { valid: true, username: "groupname" } or { valid: false, error: "..." }
 */
function parseTarget(target) {
  if (!target || typeof target !== 'string') {
    return { valid: false, error: 'Missing target parameter.' };
  }

  const trimmed = target.trim();

  // Handle https://t.me/username
  if (trimmed.startsWith('https://t.me/') || trimmed.startsWith('http://t.me/')) {
    const path = trimmed.replace(/^https?:\/\/t\.me\//, '');
    const username = path.split('/')[0];
    if (!isValidUsername(username)) {
      return { valid: false, error: `Invalid Telegram username: "${username}".` };
    }
    return { valid: true, username };
  }

  // Handle @username
  if (trimmed.startsWith('@')) {
    const username = trimmed.slice(1);
    if (!isValidUsername(username)) {
      return { valid: false, error: `Invalid Telegram username: "${trimmed}".` };
    }
    return { valid: true, username };
  }

  return {
    valid: false,
    error: 'Invalid target format. Use @username or https://t.me/username.',
  };
}

/**
 * Telegram usernames: 5–32 chars, alphanumeric + underscore, no leading/trailing underscore.
 */
function isValidUsername(username) {
  return /^[a-zA-Z0-9][a-zA-Z0-9_]{3,30}[a-zA-Z0-9]$/.test(username);
}

module.exports = { parseTarget };
