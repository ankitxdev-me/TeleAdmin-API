const axios = require('axios');

const TELETHON_BASE_URL = `http://127.0.0.1:${process.env.TELETHON_PORT || 5000}`;

/**
 * Fetches admins for a Telegram group via the local Telethon service.
 * @param {string} username - Telegram group username (without @)
 * @returns {Promise<object>} - The parsed JSON response from the Python service
 */
async function fetchAdmins(username) {
  const response = await axios.get(`${TELETHON_BASE_URL}/admins`, {
    params: { username },
    timeout: 30000,
  });
  return response.data;
}

/**
 * Checks if the Telethon service is reachable and authenticated.
 * @returns {Promise<string>} - "connected" or "disconnected"
 */
async function checkHealth() {
  try {
    const response = await axios.get(`${TELETHON_BASE_URL}/health`, { timeout: 5000 });
    return response.data.status === 'ok' ? 'connected' : 'disconnected';
  } catch {
    return 'disconnected';
  }
}

module.exports = { fetchAdmins, checkHealth };
