// Controller: dashboardController.js
const logger = require("../logger")
const db = require("../models")
const { extractEmailFromToken } = require("../utils/jwtUtils")

// Get Organization-wide Metrics
exports.getOrganizationMetrics = async (req, res) => {
  const token = req.headers.authorization.split(" ")[1]
  const { role, email, role_id } = await extractEmailFromToken(token)

  // Fetch role and employeeTableId using email
  const employee = await db.Employee.findOne({ where: { employee_email: email } })
  if (!employee) return res.status(404).send("Employee not found")
  const { id: employeeTableId } = employee

  const { deliveryUnit } = req.params
  const filter = deliveryUnit == "all" ? "" : `AND DU = '${deliveryUnit}'`
  logger.info(filter)
  console.log(req.params)
  try {
    console.log(email, role)
    // Fetch role and employeeTableId using email
    const employee = await db.Employee.findOne({ where: { employee_email: email } })
    console.log(employee)
    if (!employee) return res.status(404).send("Employee not found")
    const { id: employeeTableId } = employee

    // Fetch projects based on role
    let projects
    if (role === "Admin") {
      projects = await db.Project.findAll({
        attributes: ["id"],
      })
    } else {
      projects = await db.Project.findAll({
        where: {
          [db.Sequelize.Op.or]: [{ delivery_manager_id: employeeTableId }, { delivery_head_id: employeeTableId }],
        },
        attributes: ["id"],
      })
    }

    const projectIds = projects.map((project) => project.id)
    if (projectIds.length === 0) {
      return res.json({
        totalDirectCost: 0,
        totalGrossMargin: 0,
        avgGrossMarginPercentage: 0,
      })
    }

    const metrics = await db.sequelize.query(
      `SELECT 
        SUM(total_direct_cost) AS totalDirectCost,
        SUM(gross_margin) AS totalGrossMargin,
        AVG(percentage_gross_margin) AS avgGrossMarginPercentage
      FROM Employee_Project_Calculations
      WHERE project_id IN (${projectIds.map(() => "?").join(",")})
      AND CONCAT(year, '-', LPAD(month, 2, '0'), '-01') >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 6 MONTH), '%Y-%m-01')
      ${filter}`,
      { replacements: projectIds },
    )
    res.json(metrics[0])
  } catch (err) {
    logger.error(`Error in getOrganizationMetrics: ${err.message}`)
    res.status(500).send(err.message)
  }
}

exports.getDuList = async (req, res) => {
  try {
    const listDU = await db.sequelize.query(
      `SELECT group_concat(DISTINCT delivery_unit ORDER BY delivery_unit ASC) AS delivery FROM gm_calculator.projects`,
    )

    // Check if the query returned any results
    if (!listDU[0] || !listDU[0][0]?.delivery) {
      return res.json([]) // Return an empty array if no delivery units are found
    }

    const deliveryUnits = listDU[0][0].delivery.split(",")
    res.json(deliveryUnits)
  } catch (err) {
    console.error("Error fetching delivery units:", err.message) // Log the error for debugging
    res.status(500).send("An error occurred while fetching delivery units.")
  }
}

// Get Project-wise Trends
exports.getProjectTrends = async (req, res) => {
  const token = req.headers.authorization.split(" ")[1]
  const { role, email, role_id } = await extractEmailFromToken(token)

  const { deliveryUnit } = req.params
  const filter = deliveryUnit == "all" ? "" : `AND DU = '${deliveryUnit}'`
  logger.info(filter)

  try {
    const employee = await db.Employee.findOne({ where: { employee_email: email } })
    if (!employee) return res.status(404).send("Employee not found")
    const { id: employeeTableId } = employee

    // Fetch projects based on role
    let projects
    if (role === "Admin") {
      projects = await db.Project.findAll({
        attributes: ["id"],
      })
    } else {
      projects = await db.Project.findAll({
        where: {
          [db.Sequelize.Op.or]: [{ delivery_manager_id: employeeTableId }, { delivery_head_id: employeeTableId }],
        },
        attributes: ["id"],
      })
    }

    const projectIds = projects.map((project) => project.id)

    // Handle empty projectIds
    if (projectIds.length === 0) {
      return res.json([])
    }

    // Execute the query
    const trends = await db.sequelize.query(
      `SELECT 
        project_id,
        month,
        year,
        project_name,
        AVG(percentage_gross_margin) AS avg_percentage_gross_margin
      FROM employee_project_calculations
      JOIN projects ON employee_project_calculations.project_id = projects.id
      WHERE project_id IN (${projectIds.map(() => "?").join(",")})
      AND CONCAT(year, '-', LPAD(month, 2, '0')) >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 6 MONTH), '%Y-%m')
      ${filter}
      GROUP BY project_id, year, month, project_name
      ORDER BY project_id, year, month`,
      { replacements: projectIds },
    )

    res.json(trends[0])
  } catch (err) {
    logger.error(`Error in getProjectTrends: ${err.message}`)
    res.status(500).send(err.message)
  }
}
