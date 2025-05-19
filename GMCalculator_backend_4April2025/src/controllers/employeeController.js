const db = require("../models")
const moment = require("moment")
const logger = require("../logger")

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await db.Employee.findAll()
    res.json(employees)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await db.Employee.findByPk(req.params.id)
    if (!employee) {
      return res.status(404).json({ error: "Employee not found 5" })
    }
    res.json(employee)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Create a new employee
exports.createEmployee = async (req, res) => {
  const { employee_id, employee_email, employee_name, role_id } = req.body
  try {
    const newEmployee = await db.Employee.create({
      employee_id,
      employee_email,
      employee_name,
      role_id,
      created_at: moment().format(),
      updated_at: moment().format(),
    })
    res.status(201).json(newEmployee)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Update an employee
exports.updateEmployee = async (req, res) => {
  const { employee_id, employee_email, employee_name, role_id } = req.body
  try {
    const employee = await db.Employee.findByPk(req.params.id)
    if (!employee) {
      return res.status(404).json({ error: "Employee not found 6" })
    }
    await employee.update({
      employee_id,
      employee_email,
      employee_name,
      role_id,
      updated_at: moment().format(),
    })
    res.json({ message: "Employee updated successfully" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Delete an employee
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await db.Employee.findByPk(req.params.id)
    if (!employee) {
      return res.status(404).json({ error: "Employee not found 7" })
    }
    await employee.destroy()
    res.json({ message: "Employee deleted successfully" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Get list of employees with role DM (role_id = 1)
exports.getDMs = async (req, res) => {
  try {
    const employees = await db.Employee.findAll({ where: { role_id: 1 } })
    res.json(employees)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Get list of employees with role DH (role_id = 2)
exports.getDHs = async (req, res) => {
  try {
    const employees = await db.Employee.findAll({ where: { role_id: 2 } })
    res.json(employees)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
