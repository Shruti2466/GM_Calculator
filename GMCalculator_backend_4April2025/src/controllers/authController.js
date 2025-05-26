const jwt = require("jsonwebtoken")
const db = require("../models")
const bcrypt = require("bcrypt")
const logger = require("../logger")

exports.login = async (req, res) => {
  const { email, password } = req.body
  try {
    // Find user by email
    const user = await db.User.findOne({
      where: { email },
      include: [
        {
          model: db.Role,
          attributes: ["role_name"],
        },
      ],
    })

    if (!user) return res.status(401).send("Invalid credentials")

    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) return res.status(401).send("Invalid credentials")

    // Fetch employee details
    const employee = await db.Employee.findOne({ where: { employee_email: email } })
    if (!employee) return res.status(404).send("Employee not found")

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        role_id: user.role_id,
        role: user.Role.role_name,
        email: user.email,
      },
      process.env.JWT_SECRET,
    )

    res.json({
      token,
      role: user.Role.role_name,
      email: user.email,
      employeeName: employee.employee_name,
      employeeId: employee.employee_id,
      employeeTableId: employee.id,
    })
  } catch (err) {
    logger.error(`Login error: ${err.message}`)
    res.status(500).send(err.message)
  }
}

exports.register = async (req, res) => {
  logger.info("In register >>> ");
  const { name, email, password } = req.body; // Removed role_id from destructuring

  try {
    // Check if the employee name exists in the employees table
    const employee = await db.Employee.findOne({ where: { employee_name: name } });
    if (!employee) {
      return res.status(400).json({ message: "Employee does not exist in the system." });
    }

    // Fetch role_id from the employee record
    const role_id = employee.role_id;

    // Validate role_id (which maps to the `id` column in the `roles` table)
    const role = await db.Role.findByPk(role_id);
    if (!role) {
      return res.status(400).send("Invalid role ID");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    logger.info("before DB create");

    // Create the user
    const user = await db.User.create({
      name,
      email,
      password: hashedPassword,
      role_id, // Use the role_id from the employee record
    });
    logger.info("after DB create");
    logger.info(user);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        role_id: user.role_id,
        role: role.role_name,
        email: user.email,
      },
      process.env.JWT_SECRET,
    );

    res.status(201).json({ token });
  } catch (err) {
    logger.error(`Registration error: ${err.message}`);
    res.status(500).send(err.message);
  }
};