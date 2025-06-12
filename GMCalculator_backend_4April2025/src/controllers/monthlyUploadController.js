const xlsx = require("xlsx")
const db = require("../models")
const logger = require("../logger")
const fs = require("fs")
const path = require("path")
const { Op } = require("sequelize")

const uploadDir = path.join(__dirname, "../../uploads/monthly-data")
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

exports.uploadMonthlyData = async (req, res) => {
  if (!req.file) {
    logger.error("No file uploaded")
    return res.status(400).json({ error: "Please upload an Excel file" })
  }

  const allowedTypes = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"]

  if (!allowedTypes.includes(req.file.mimetype)) {
    logger.error(`Invalid file type: ${req.file.mimetype}`)
    return res.status(400).json({ error: "Invalid file type. Please upload an Excel file" })
  }

  try {
    const filePath = req.file.path
    const workbook = xlsx.readFile(filePath)

    if (workbook.SheetNames.length > 0) {
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const data = xlsx.utils.sheet_to_json(worksheet)

      const results = await processDeliveryInvestmentReport(data)

      await db.DeliveryInvestmentReport.create({
        project_code: req.body.project_code || null,
        uploaded_path: filePath,
        created_by: req.user.id,
      })

      return res.status(200).json({
        message: "File processed successfully",
        results: { deliveryInvestmentReport: results },
        filePath: filePath,
        fileName: req.file.filename,
      })
    } else {
      return res.status(400).json({ error: "No sheets found in the Excel file" })
    }
  } catch (error) {
    logger.error(`Error processing file: ${error.message}`)
    return res.status(500).json({ error: "Error processing file", details: error.message })
  }
}

exports.downloadFile = async (req, res) => {
  try {
    const { filePath } = req.body

    if (!filePath) {
      return res.status(400).json({ error: "File path is required" })
    }

    const absolutePath = path.join(__dirname, "../../", filePath)

    if (!fs.existsSync(absolutePath)) {
      const originalFileName = path.basename(filePath)
      const directory = path.dirname(absolutePath)

      if (fs.existsSync(directory)) {
        const files = fs.readdirSync(directory)
        const matchingFile = files.find((file) => file.includes("-" + originalFileName))

        if (matchingFile) {
          const newPath = path.join(directory, matchingFile)
          res.setHeader("Content-Disposition", `attachment; filename="${originalFileName}"`)
          res.setHeader("Content-Type", "application/octet-stream")
          const fileStream = fs.createReadStream(newPath)
          fileStream.pipe(res)
          return
        }
      }

      return res.status(404).json({ error: "File not found" })
    }

    const fileName = path.basename(absolutePath)
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`)
    res.setHeader("Content-Type", "application/octet-stream")

    const fileStream = fs.createReadStream(absolutePath)
    fileStream.pipe(res)

    fileStream.on("error", (error) => {
      if (!res.headersSent) {
        res.status(500).json({ error: "Error streaming file", details: error.message })
      }
    })
  } catch (error) {
    res.status(500).json({ error: "Failed to download file", details: error.message })
  }
}

exports.trackMonthlyUpload = async (req, res) => {
  const { sheet_name, file_name, file_path } = req.body
  const uploaded_by = req.user.id

  try {
    if (!sheet_name || !file_name || !file_path) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const [sheet] = await db.sequelize.query(`SELECT id FROM Monthly_sheet WHERE sheet_name = ? LIMIT 1`, {
      replacements: [sheet_name],
      type: db.Sequelize.QueryTypes.SELECT,
    })

    if (!sheet) {
      return res.status(400).json({ error: "Invalid sheet name" })
    }

    const sheet_id = sheet.id

    const latestVersion = await db.Monthly_uploaded_sheets.findOne({
      where: { sheet_id },
      order: [["version", "DESC"]],
    })

    const newVersion = latestVersion ? latestVersion.version + 1 : 1

    await db.Monthly_uploaded_sheets.update({ is_current: false }, { where: { sheet_id } })

    const newUpload = await db.Monthly_uploaded_sheets.create({
      sheet_id,
      version: newVersion,
      file_name,
      file_path,
      uploaded_by,
      is_current: true,
    })

    res.status(201).json(newUpload)
  } catch (error) {
    res.status(500).json({ error: "Upload tracking failed", details: error.message })
  }
}

exports.getAllUploadedSheets = async (req, res) => {
  try {
    const uploadedSheets = await db.sequelize.query(
      `SELECT mus.id, mus.file_name, mus.file_path, mus.version, 
      DATE_FORMAT(mus.uploaded_at, '%Y-%m-%dT%H:%i:%sZ') AS uploaded_at, 
      CASE WHEN mus.is_current = 1 THEN true ELSE false END AS is_current, 
      ms.sheet_name, u.name AS uploaded_by
FROM monthly_uploaded_sheets mus
JOIN monthly_sheet ms ON mus.sheet_id = ms.id
JOIN users u ON mus.uploaded_by = u.id`,
      { type: db.Sequelize.QueryTypes.SELECT },
    )

    res.status(200).json(uploadedSheets)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch uploaded sheets", details: error.message })
  }
}

exports.getAdditionalCosts = async (req, res) => {
  try {
    const additionalCosts = await db.sequelize.query(
      `SELECT ac.id, ac.cost_name, ac.cost, 
       DATE_FORMAT(ac.createdat, '%Y-%m-%dT%H:%i:%sZ') AS created_at,
       creator.name AS created_by,
       DATE_FORMAT(ac.updatedat, '%Y-%m-%dT%H:%i:%sZ') AS updated_at, 
       updater.name AS updated_by
       FROM additionalcosts ac
       LEFT JOIN users creator ON ac.createdby = creator.id
       LEFT JOIN users updater ON ac.updatedby = updater.id
       ORDER BY ac.id DESC`,
      { type: db.Sequelize.QueryTypes.SELECT },
    )

    res.status(200).json(additionalCosts)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch additional costs", details: error.message })
  }
}

exports.addAdditionalCost = async (req, res) => {
  const { cost_name, cost } = req.body

  if (!cost_name || !cost) {
    return res.status(400).json({ error: "Both cost_name and cost are required." })
  }

  try {
    const newCost = await db.AdditionalCost.create({
      cost_name,
      cost,
      createdBy: req.user.id,
    })

    res.status(201).json(newCost)
  } catch (error) {
    res.status(500).json({ error: "Failed to add additional cost", details: error.message })
  }
}

exports.updateAdditionalCost = async (req, res) => {
  const { id } = req.params
  const { cost_name, cost } = req.body

  if (!cost_name || !cost) {
    return res.status(400).json({ error: "Both cost_name and cost are required." })
  }

  try {
    const [updatedRowsCount] = await db.AdditionalCost.update(
      {
        cost_name,
        cost,
        updatedBy: req.user.id,
      },
      {
        where: { id }
      }
    )

    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: "Additional cost not found." })
    }

    const updatedCost = await db.AdditionalCost.findByPk(id)
    res.status(200).json(updatedCost)
  } catch (error) {
    res.status(500).json({ error: "Failed to update additional cost", details: error.message })
  }
}

exports.getUSExchangeRate = async (req, res) => {
  try {
    const exchangeRate = await db.sequelize.query(
      `SELECT r.rate,
       DATE_FORMAT(r.updatedat, '%Y-%m-%dT%H:%i:%sZ') AS updated_at,
       u.name AS updated_by
       FROM usexchangerate r
       LEFT JOIN users u ON r.updatedby = u.id
       LIMIT 1`,
      { type: db.Sequelize.QueryTypes.SELECT },
    )

    if (exchangeRate.length === 0) {
      return res.status(404).json({ error: "Exchange rate not found" })
    }

    res.status(200).json(exchangeRate[0])
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch US exchange rate", details: error.message })
  }
}

exports.updateUSExchangeRate = async (req, res) => {
  const { rate } = req.body

  if (!rate || isNaN(rate)) {
    return res.status(400).json({ error: "A valid exchange rate is required." })
  }

  try {
    await db.sequelize.query(`UPDATE usexchangerate SET rate = ?, updatedby = ?`, {
      replacements: [rate, req.user.id],
      type: db.Sequelize.QueryTypes.UPDATE,
    })

    res.status(200).json({ message: "Exchange rate updated successfully.", rate })
  } catch (error) {
    res.status(500).json({ error: "Failed to update exchange rate", details: error.message })
  }
}

async function processDeliveryInvestmentReport(data) {
  let inserted = 0
  let errors = 0
  const transaction = await db.sequelize.transaction()

  try {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    const existingRows = await db.sequelize.query(
      `SELECT created_at FROM delivery_investment_report 
       WHERE MONTH(created_at) = ? AND YEAR(created_at) = ? LIMIT 1`,
      {
        replacements: [month, year],
        type: db.Sequelize.QueryTypes.SELECT,
        transaction,
      },
    )

    let createdAtToReuse = null

    if (existingRows.length > 0) {
      createdAtToReuse = existingRows[0].created_at

      await db.sequelize.query(
        `DELETE FROM delivery_investment_report 
         WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?`,
        {
          replacements: [month, year],
          transaction,
        },
      )
    }

    for (const row of data) {
      try {
        const record = {
          service_type: row["Service Type"] || null,
          account_name: row["Account Name"] || null,
          type: row["Type"] || null,
          delivery_unit: row["DU"] || null,
          project_code: row["Project ID"] || null,
          project_name: row["Project Name"] || null,
          engagement_type: row["Engagement Type"] || null,
          staffing_model: row["Staffing Model"] || null,
          employee_id: row["Employee ID"] || null,
          employee_name: row["Employe Name"] || null,
          designation: row["Designation"] || null,
          resource_status: row["Resource Status"] || null,
          technical_involvement: row["Technical Involvement"] || null,
        }

        await db.sequelize.query(
          `INSERT INTO delivery_investment_report 
           (service_type, account_name, type, delivery_unit, project_code, project_name,
            engagement_type, staffing_model, employee_id, employee_name, designation,
            resource_status, technical_involvement, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          {
            replacements: [
              record.service_type,
              record.account_name,
              record.type,
              record.delivery_unit,
              record.project_code,
              record.project_name,
              record.engagement_type,
              record.staffing_model,
              record.employee_id,
              record.employee_name,
              record.designation,
              record.resource_status,
              record.technical_involvement,
              createdAtToReuse || now,
              now,
            ],
            transaction,
          },
        )

        inserted++
      } catch (err) {
        logger.error(`Error processing row: ${JSON.stringify(row)}. Error: ${err.message}`)
        errors++
      }
    }

    await transaction.commit()
    return { inserted, errors }
  } catch (error) {
    await transaction.rollback()
    logger.error(`Transaction error: ${error.message}`)
    throw error
  }
}

exports.processSalarySheet = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Please upload an Excel file" })
  }

  const allowedTypes = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"]
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: "Invalid file type. Please upload an Excel file" })
  }

  try {
    const filePath = req.file.path
    const workbook = xlsx.readFile(filePath)
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const data = xlsx.utils.sheet_to_json(worksheet)

    const transaction = await db.sequelize.transaction()
    try {
      let inserted = 0
      let errors = 0

      const now = new Date()
      const month = now.getMonth() + 1
      const year = now.getFullYear()

      const existingRows = await db.sequelize.query(
        `SELECT created_at FROM salarySheet 
         WHERE MONTH(created_at) = ? AND YEAR(created_at) = ? LIMIT 1`,
        {
          replacements: [month, year],
          type: db.Sequelize.QueryTypes.SELECT,
          transaction,
        },
      )

      let createdAtToReuse = null

      if (existingRows.length > 0) {
        createdAtToReuse = existingRows[0].created_at
        await db.sequelize.query(
          `DELETE FROM salarySheet 
           WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?`,
          { replacements: [month, year], transaction },
        )
      }

      for (const row of data) {
        try {
          let dateOfJoining = null
          const doj = row["Date Of Joining"]

          if (doj) {
            if (typeof doj === "number") {
              dateOfJoining = new Date((doj - 25569) * 86400 * 1000).toISOString().slice(0, 10)
            } else if (typeof doj === "string" && doj.includes("/")) {
              const parts = doj.split("/")
              if (parts.length === 3) {
                let [monthStr, day, yearStr] = parts
                if (yearStr.length === 2) yearStr = "20" + yearStr
                dateOfJoining = `${yearStr}-${monthStr.padStart(2, "0")}-${day.padStart(2, "0")}`
              }
            }
          }

          const record = {
            EmployeeCode: row["Employee Code"] || null,
            EmployeeName: row["Employee Name"] || null,
            DateOfJoining: dateOfJoining,
            CurrentDesignation: row["Current Designation"] || null,
            Grade: row["Grade"] || null,
            CurrentDepartment: row["Current Department"] || null,
            CTC: row["CTC"] || null,
            AdditionalCostEmployee: row["Additional cost"] || 0.0,
          }

          if (!record.EmployeeCode || !record.EmployeeName || !record.DateOfJoining) {
            errors++
            continue
          }

          await db.sequelize.query(
            `INSERT INTO salarySheet 
            (EmployeeCode, EmployeeName, DateOfJoining, CurrentDesignation, Grade, CurrentDepartment, CTC, AdditionalCostEmployee, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            {
              replacements: [
                record.EmployeeCode,
                record.EmployeeName,
                record.DateOfJoining,
                record.CurrentDesignation,
                record.Grade,
                record.CurrentDepartment,
                record.CTC,
                record.AdditionalCostEmployee,
                createdAtToReuse || now,
                now,
              ],
              transaction,
            },
          )

          inserted++
        } catch (err) {
          logger.error(`Error processing row: ${JSON.stringify(row)}. Error: ${err.message}`)
          errors++
        }
      }

      await transaction.commit()

      return res.status(200).json({
        message: "Salary sheet processed successfully",
        results: { inserted, errors },
        filePath,
        fileName: req.file.filename,
      })
    } catch (error) {
      await transaction.rollback()
      return res.status(500).json({ error: "Error processing file", details: error.message })
    }
  } catch (error) {
    return res.status(500).json({ error: "Error processing file", details: error.message })
  }
}

exports.processRevenueSheet = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Please upload an Excel file" })
  }

  const allowedTypes = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"]
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: "Invalid file type. Please upload an Excel file" })
  }

  try {
    const filePath = req.file.path
    const workbook = xlsx.readFile(filePath)
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const data = xlsx.utils.sheet_to_json(worksheet)

    const transaction = await db.sequelize.transaction()
    try {
      let inserted = 0
      let errors = 0

      const now = new Date()
      const month = now.getMonth() + 1
      const year = now.getFullYear()

      const existingRows = await db.sequelize.query(
        `SELECT created_at FROM revenue 
         WHERE MONTH(created_at) = ? AND YEAR(created_at) = ? LIMIT 1`,
        {
          replacements: [month, year],
          type: db.Sequelize.QueryTypes.SELECT,
          transaction,
        },
      )

      let createdAtToReuse = null

      if (existingRows.length > 0) {
        createdAtToReuse = existingRows[0].created_at
        await db.sequelize.query(
          `DELETE FROM revenue 
           WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?`,
          { replacements: [month, year], transaction },
        )
      }

      for (const row of data) {
        try {
          const record = {
            service_type: row["Service Type"] || null,
            du: row["DU"] || null,
            project_id: row["Project Id"] || null,
            project_name: row["Project Name"] || null,
            account_name: row["Account Name"] || null,
            revenue: row["Revenue"] ? Number(String(row["Revenue"]).replace(/,/g, "")) : null,
          }

          if (!record.project_id || !record.project_name) {
            errors++
            continue
          }

          await db.sequelize.query(
            `INSERT INTO revenue 
            (service_type, du, project_id, project_name, account_name, revenue, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            {
              replacements: [
                record.service_type,
                record.du,
                record.project_id,
                record.project_name,
                record.account_name,
                record.revenue,
                createdAtToReuse || now,
                now,
              ],
              transaction,
            },
          )

          inserted++
        } catch (err) {
          logger.error(`Error processing row: ${JSON.stringify(row)}. Error: ${err.message}`)
          errors++
        }
      }

      await transaction.commit()

      return res.status(200).json({
        message: "Revenue sheet processed successfully",
        results: { inserted, errors },
        filePath,
        fileName: req.file.filename,
      })
    } catch (error) {
      await transaction.rollback()
      return res.status(500).json({ error: "Error processing file", details: error.message })
    }
  } catch (error) {
    return res.status(500).json({ error: "Error processing file", details: error.message })
  }
}

exports.calculateInterimCost = async (req, res) => {
  try {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear
    const monthYear = `${String(prevMonth).padStart(2, "0")}/${prevYear}`

    const [existingRows] = await db.sequelize.query(
      `SELECT COUNT(*) as count FROM interimcostcalculation WHERE month_year = ?`,
      { replacements: [monthYear], type: db.Sequelize.QueryTypes.SELECT },
    )

    if (existingRows.count > 0) {
      await db.sequelize.query(`DELETE FROM interimcostcalculation WHERE month_year = ?`, {
        replacements: [monthYear],
        type: db.Sequelize.QueryTypes.DELETE,
      })
    }

    await db.sequelize.query(
      `INSERT INTO interimcostcalculation
        (ProjectId, EmpId, TechnicalInvolvement, Salary, AdditionalCost, month_year)
      SELECT DISTINCT
        d.project_code AS ProjectId,
        d.employee_id AS EmpId,
        CAST(d.technical_involvement AS DECIMAL(3,2)) AS TechnicalInvolvement,
        ROUND((s.CTC / 12 + s.AdditionalCostEmployee) / exchange_rate.rate * d.technical_involvement, 2) AS Salary,
        COALESCE((SELECT SUM(cost) FROM additionalcosts), 0.00) AS AdditionalCost,
        :monthYear AS month_year
      FROM delivery_investment_report d
      JOIN salarySheet s ON d.employee_id = s.EmployeeCode
      JOIN (SELECT rate FROM usexchangerate ORDER BY updatedat DESC LIMIT 1) exchange_rate
      WHERE MONTH(d.created_at) = :currentMonth AND YEAR(d.created_at) = :currentYear`,
      {
        replacements: { monthYear, currentMonth, currentYear },
        type: db.Sequelize.QueryTypes.INSERT,
      },
    )

    res.status(201).json({ message: "Interim cost calculation completed successfully." })
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate interim cost", details: error.message })
  }
}

exports.calculateInterimProjectGM = async (req, res) => {
  try {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear
    const monthYear = `${String(prevMonth).padStart(2, "0")}/${prevYear}`

    const [existingRows] = await db.sequelize.query(
      `SELECT COUNT(*) as count FROM interimprojectgm WHERE month_year = ?`,
      { replacements: [monthYear], type: db.Sequelize.QueryTypes.SELECT },
    )

    if (existingRows.count > 0) {
      await db.sequelize.query(`DELETE FROM interimprojectgm WHERE month_year = ?`, {
        replacements: [monthYear],
        type: db.Sequelize.QueryTypes.DELETE,
      })
    }

    await db.sequelize.query(
      `INSERT INTO interimprojectgm (ProjectId, Revenue, Cost, month_year)
       SELECT 
         i.ProjectId, 
         r.revenue AS Revenue,
         SUM(i.Salary + i.AdditionalCost) AS Cost,
         :monthYear AS month_year
       FROM interimcostcalculation i
       JOIN revenue r ON i.ProjectId = r.project_id
       WHERE i.month_year = :monthYear
         AND MONTH(r.created_at) = :currentMonth AND YEAR(r.created_at) = :currentYear
       GROUP BY i.ProjectId, r.revenue`,
      {
        replacements: { monthYear, currentMonth, currentYear },
        type: db.Sequelize.QueryTypes.INSERT,
      },
    )

    res.status(201).json({ message: "Interim Project GM calculation completed successfully." })
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate interim project GM", details: error.message })
  }
}

exports.getAllInterimProjectGM = async (req, res) => {
  try {
    const data = await db.sequelize.query(`SELECT * FROM interimprojectgm ORDER BY Id DESC`, {
      type: db.Sequelize.QueryTypes.SELECT,
    })
    res.status(200).json(data)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch interim project GM data", details: error.message })
  }
}
