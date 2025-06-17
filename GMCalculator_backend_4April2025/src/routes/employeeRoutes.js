const express = require("express")
const router = express.Router()
const employeeController = require("../controllers/employeeController") // Using the same controller
const authenticateToken = require("../middlewares/authMiddleware")
// Employee routes
router.get("/", authenticateToken, employeeController.getAllEmployees)
router.get("/:id", authenticateToken, employeeController.getEmployeeById)
router.post("/", authenticateToken, employeeController.createEmployee)
router.put("/:id", authenticateToken, employeeController.updateEmployee)
router.delete("/:id", authenticateToken, employeeController.deleteEmployee)
router.get("/role/dm", authenticateToken, employeeController.getDMs)
router.get("/role/dh", authenticateToken, employeeController.getDHs)

// Admin-only route to create employee
router.post("/admin/create", authenticateToken, employeeController.createEmployeeByAdmin)

module.exports = router

const db = require("../models")
const moment = require("moment")
const logger = require("../logger")

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await db.Employee.findAll({
      include: [
        {
          model: db.Role,
          attributes: ["role_name"],
        },
      ],
    })
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
      return res.status(404).json({ error: "Employee not found" })
    }
    res.json(employee)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Create a new employee
exports.createEmployee = async (req, res) => {
  const { employee_email, employee_name, role_id } = req.body
  try {
    const newEmployee = await db.Employee.create({
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
  const { employee_email, employee_name, role_id } = req.body
  try {
    const employee = await db.Employee.findByPk(req.params.id)
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" })
    }
    await employee.update({
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
      return res.status(404).json({ error: "Employee not found" })
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
