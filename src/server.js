require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openApiDocument = require('./openapi.json');
const { checkHealth } = require('./services/telegramService');
const { requireApiKey } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.get('/openapi.json', (req, res) => res.json(openApiDocument));

// Routes
app.use('/api/admins', requireApiKey, require('./routes/admins'));

// Health check
app.get('/health', async (req, res) => {
  const telegram = await checkHealth();
  res.json({
    success: true,
    status: 'ok',
    telegram,
  });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} does not exist.`,
    },
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[server] Telegram Admin API running on port ${PORT}`);
  });
}

module.exports = app;
