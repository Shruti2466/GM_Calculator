const request = require('supertest')
const app = require('../../../app')

describe('Project Controller', () => {
  let token
  let createdProjectId

  beforeAll(async () => {
    // Login and get JWT token (replace with valid credentials)
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password' })
    token = res.body.token
  })

  it('should create a new project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project_code: 'P001',
        engagement_type: 'T&M',
        staffingmodel: 'Onsite',
        service_type: 'Development',
        delivery_unit: 'DU1',
        account_name: 'Test Account',
        project_name: 'Test Project',
        delivery_manager_id: 1,
        delivery_head_id: 2,
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      })
    expect(res.statusCode).toBe(201)
    expect(res.body.project_code).toBe('P001')
    createdProjectId = res.body.id
  })

  it('should get all projects', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('should edit a project', async () => {
    const res = await request(app)
      .put(`/api/projects/${createdProjectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        project_code: 'P001-EDIT',
        engagement_type: 'Fixed',
        staffingmodel: 'Remote',
        service_type: 'Support',
        delivery_unit: 'DU2',
        account_name: 'Test Account Edit',
        project_name: 'Test Project Edit',
        delivery_manager_id: 1,
        delivery_head_id: 2,
        start_date: '2024-02-01',
        end_date: '2024-11-30'
      })
    expect([200, 201]).toContain(res.statusCode)
  })

  it('should upload files and calculate metrics', async () => {
    const res = await request(app)
      .post(`/api/projects/${createdProjectId}/upload`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file1', '__tests__/test-data/valid-monthly.xlsx')
      .attach('file2', '__tests__/test-data/valid-salary.xlsx')
      .attach('file3', '__tests__/test-data/valid-revenue.xlsx')
    expect(res.statusCode).toBe(200)
    expect(res.body.msg).toBeDefined()
  })

  it('should get project chart data', async () => {
    const res = await request(app)
      .get(`/api/projects/${createdProjectId}/chart-data`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('should get audit list of uploaded files', async () => {
    const res = await request(app)
      .get('/api/projects/auditlist')
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('should delete the project', async () => {
    const res = await request(app)
      .delete(`/api/projects/${createdProjectId}`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toMatch(/Project deleted successfully/)
  })
})