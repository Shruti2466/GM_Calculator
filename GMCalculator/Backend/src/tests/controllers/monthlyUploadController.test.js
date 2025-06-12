const request = require('supertest')
const app = require('../../../app')

describe('Monthly Upload Controller', () => {
  let token

  beforeAll(async () => {
    // Login and get JWT token (replace with valid credentials)
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password' })
    token = res.body.token
  })

  describe('POST /api/upload/monthly-data', () => {
    it('should upload a valid Excel file', async () => {
      const res = await request(app)
        .post('/api/upload/monthly-data')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', '__tests__/test-data/valid-monthly.xlsx')
      expect(res.statusCode).toBe(200)
      expect(res.body.message).toMatch(/File processed successfully/)
    })

    it('should reject missing file', async () => {
      const res = await request(app)
        .post('/api/upload/monthly-data')
        .set('Authorization', `Bearer ${token}`)
      expect(res.statusCode).toBe(400)
      expect(res.body.error).toMatch(/Please upload an Excel file/)
    })

    it('should reject invalid file type', async () => {
      const res = await request(app)
        .post('/api/upload/monthly-data')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', '__tests__/test-data/invalid.txt')
      expect(res.statusCode).toBe(400)
      expect(res.body.error).toMatch(/Invalid file type/)
    })
  })

  describe('POST /api/upload/monthly-data/salary-sheet', () => {
    it('should upload a valid salary sheet', async () => {
      const res = await request(app)
        .post('/api/upload/monthly-data/salary-sheet')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', '__tests__/test-data/valid-salary.xlsx')
      expect(res.statusCode).toBe(200)
      expect(res.body.message).toMatch(/Salary sheet processed successfully/)
    })
  })

  describe('POST /api/upload/monthly-data/revenue-sheet', () => {
    it('should upload a valid revenue sheet', async () => {
      const res = await request(app)
        .post('/api/upload/monthly-data/revenue-sheet')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', '__tests__/test-data/valid-revenue.xlsx')
      expect(res.statusCode).toBe(200)
      expect(res.body.message).toMatch(/Revenue sheet processed successfully/)
    })
  })

  describe('POST /api/upload/monthly-data/interim-cost', () => {
    it('should calculate interim cost', async () => {
      const res = await request(app)
        .post('/api/upload/monthly-data/interim-cost')
        .set('Authorization', `Bearer ${token}`)
      expect(res.statusCode).toBe(201)
      expect(res.body.message).toMatch(/Interim cost calculation completed successfully/)
    })
  })

  describe('POST /api/upload/monthly-data/interim-project-gm', () => {
    it('should calculate interim project GM', async () => {
      const res = await request(app)
        .post('/api/upload/monthly-data/interim-project-gm')
        .set('Authorization', `Bearer ${token}`)
      expect(res.statusCode).toBe(201)
      expect(res.body.message).toMatch(/Interim Project GM calculation completed successfully/)
    })
  })

  describe('GET /api/upload/monthly-data/interim-project-gm', () => {
    it('should get all interim project GM data', async () => {
      const res = await request(app)
        .get('/api/upload/monthly-data/interim-project-gm')
        .set('Authorization', `Bearer ${token}`)
      expect(res.statusCode).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })
  })
})