const request = require('supertest');
const app = require('../server');
const fs = require('fs').promises;
const path = require('path');
const { location } = require('../utils/file.util');

describe('file routes', () => {
  beforeAll(async () => {
    await fs.mkdir(location, { recursive: true });
  });

  afterAll(async () => {
    await fs.unlink(path.resolve(location, 'public-private.txt'))
  });

  describe('GET /files/:publicKey', () => {
    const publicKey = 'public';

    it('returns a single file as stream', async () => {
      // * Create the file
      await fs.writeFile(path.resolve(location, 'public-private.txt'), 'This is some example text.')

      // Make a request to the server with the public key as param
      const response = await request(app).get(`/files/${publicKey}`)

      expect(response.status).toBe(200)
      expect(response.headers['transfer-encoding']).toBe('chunked')
      expect(response.buffered).toBe(true)
      expect(response.text).toBe('This is some example text.')
    });

    it('returns 404 if not found', async () => {
      const response = await request(app).get(`/files/${publicKey}2`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('File Not Found')
    })
  });
})