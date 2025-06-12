const request = require('supertest')
const app = require('../../../app')

describe('Monthly Upload Integration', () => {
  let token

  beforeAll(async () => {
    // Login and get JWT token (replace with valid credentials)
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password' })
    token = res.body.token
  })

  it('should upload monthly data, salary sheet, and revenue sheet, then calculate interim cost and project GM', async () => {
    // Upload monthly data
    let res = await request(app)
      .post('/api/upload/monthly-data')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', '__tests__/test-data/valid-monthly.xlsx')
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toMatch(/File processed successfully/)

    // Upload salary sheet
    res = await request(app)
      .post('/api/upload/monthly-data/salary-sheet')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', '__tests__/test-data/valid-salary.xlsx')
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toMatch(/Salary sheet processed successfully/)

    // Upload revenue sheet
    res = await request(app)
      .post('/api/upload/monthly-data/revenue-sheet')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', '__tests__/test-data/valid-revenue.xlsx')
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toMatch(/Revenue sheet processed successfully/)

    // Calculate interim cost
    res = await request(app)
      .post('/api/upload/monthly-data/interim-cost')
      .set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(201)
    expect(res.body.message).toMatch(/Interim cost calculation completed successfully/)

    // Calculate interim project GM
    res = await request(app)
      .post('/api/upload/monthly-data/interim-project-gm')
      .set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(201)
    expect(res.body.message).toMatch(/Interim Project GM calculation completed successfully/)

    // Get all interim project GM data
    res = await request(app)
      .get('/api/upload/monthly-data/interim-project-gm')
      .set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('should fail to upload with missing file', async () => {
    const res = await request(app)
      .post('/api/upload/monthly-data')
      .set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/Please upload an Excel file/)
  })

  it('should fail to upload with invalid file type', async () => {
    const res = await request(app)
      .post('/api/upload/monthly-data')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', '__tests__/test-data/invalid.txt')
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/Invalid file type/)
  })
})