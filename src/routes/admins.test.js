const request = require('supertest');
const app = require('../server');

jest.mock('../services/telegramService', () => ({
  fetchAdmins: jest.fn(),
  checkHealth: jest.fn(),
}));

const { fetchAdmins, checkHealth } = require('../services/telegramService');

describe('Admins routes', () => {
  beforeEach(() => {
    fetchAdmins.mockReset();
    checkHealth.mockReset();
  });

  describe('GET /api/admins', () => {
    it('returns 400 when target is missing', async () => {
      const response = await request(app).get('/api/admins');
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_TARGET');
    });

    it('returns 200 for valid target', async () => {
      fetchAdmins.mockResolvedValue({ success: true, group: { id: 1 }, admins: [] });
      const response = await request(app).get('/api/admins?target=@groupusername');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('returns 404 when group is not found', async () => {
      fetchAdmins.mockResolvedValue({ success: false, error: { code: 'GROUP_NOT_FOUND' } });
      const response = await request(app).get('/api/admins?target=@groupusername');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/admins/bulk', () => {
    it('returns 400 when body is invalid', async () => {
      const response = await request(app)
        .post('/api/admins/bulk')
        .send({});
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_PAYLOAD');
    });

    it('returns results per target', async () => {
      fetchAdmins.mockResolvedValue({ success: true, group: { id: 1 }, admins: [] });
      const response = await request(app)
        .post('/api/admins/bulk')
        .send({ targets: ['@groupusername1'] });
      expect(response.status).toBe(200);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0].success).toBe(true);
    });
  });
});
