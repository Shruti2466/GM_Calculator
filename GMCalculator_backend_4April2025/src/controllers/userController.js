const db = require("../models")
const logger = require("../logger")
const moment = require("moment")

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await db.User.findAll({
      include: [
        {
          model: db.Role,
          attributes: ["role_name"],
        },
      ],
    })
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id, {
      include: [
        {
          model: db.Role,
          attributes: ["role_name"],
        },
      ],
    })
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Create user and employee (Admin only)
exports.createUserAndEmployee = async (req, res) => {
  const transaction = await db.sequelize.transaction()
  
  try {
    // Check if user is admin
    if (req.user.role !== "Admin") {
      await transaction.rollback()
      return res.status(403).json({ error: "Access denied. Admin privileges required." })
    }

    const { name, email, role_id } = req.body

    // Validate required fields
    if (!name || !email || !role_id) {
      await transaction.rollback()
      return res.status(400).json({ error: "All fields (name, email, role_id) are required" })
    }

    // Check if email already exists in users table
    const existingUser = await db.User.findOne({ where: { email } })
    if (existingUser) {
      await transaction.rollback()
      return res.status(400).json({ error: "Email already exists in users table" })
    }

    // Check if email already exists in employees table
    const existingEmployee = await db.Employee.findOne({ where: { employee_email: email } })
    if (existingEmployee) {
      await transaction.rollback()
      return res.status(400).json({ error: "Email already exists in employees table" })
    }

    // Validate role_id exists
    const role = await db.Role.findByPk(role_id)
    if (!role) {
      await transaction.rollback()
      return res.status(400).json({ error: "Invalid role selected" })
    }

    // Create user
    const newUser = await db.User.create({
      name,
      email,
      role_id,
      createdAt: moment().format(),
      updatedAt: moment().format(),
    }, { transaction })

    // Create corresponding employee record
    const newEmployee = await db.Employee.create({
      employee_email: email,
      employee_name: name,
      role_id,
      created_at: moment().format(),
      updated_at: moment().format(),
    }, { transaction })

    await transaction.commit()

    logger.info(`Admin ${req.user.email} created new user and employee: ${email}`)
    
    res.status(201).json({
      message: "User and employee created successfully",
      user: newUser,
      employee: newEmployee,
    })
  } catch (err) {
    await transaction.rollback()
    logger.error(`Error creating user and employee: ${err.message}`)
    res.status(500).json({ error: err.message })
  }
}

// Update user
exports.updateUser = async (req, res) => {
  const transaction = await db.sequelize.transaction()
  
  try {
    const { name, email, role_id } = req.body
    const userId = req.params.id

    const user = await db.User.findByPk(userId)
    if (!user) {
      await transaction.rollback()
      return res.status(404).json({ error: "User not found" })
    }

    // Update user
    await user.update({
      name,
      email,
      role_id,
      updatedAt: moment().format(),
    }, { transaction })

    // Update corresponding employee record
    const employee = await db.Employee.findOne({ where: { employee_email: user.email } })
    if (employee) {
      await employee.update({
        employee_email: email,
        employee_name: name,
        role_id,
        updated_at: moment().format(),
      }, { transaction })
    }

    await transaction.commit()
    
    res.json({ message: "User and employee updated successfully" })
  } catch (err) {
    await transaction.rollback()
    res.status(500).json({ error: err.message })
  }
}

// Delete user
exports.deleteUser = async (req, res) => {
  const transaction = await db.sequelize.transaction()
  
  try {
    const user = await db.User.findByPk(req.params.id)
    if (!user) {
      await transaction.rollback()
      return res.status(404).json({ error: "User not found" })
    }

    // Delete corresponding employee record
    const employee = await db.Employee.findOne({ where: { employee_email: user.email } })
    if (employee) {
      await employee.destroy({ transaction })
    }

    // Delete user
    await user.destroy({ transaction })

    await transaction.commit()
    
    res.json({ message: "User and employee deleted successfully" })
  } catch (err) {
    await transaction.rollback()
    res.status(500).json({ error: err.message })
  }
}
