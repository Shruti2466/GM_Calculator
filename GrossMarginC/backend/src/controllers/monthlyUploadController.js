const xlsx = require("xlsx")
const db = require("../models")
const logger = require("../logger")
const fs = require("fs")
const path = require("path")
const { Op } = require("sequelize")

// Ensure the upload directory exists
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
    logger.info(`Processing file: ${filePath}`)

    // Read the Excel file
    const workbook = xlsx.readFile(filePath)

    // Process the first sheet (Delivery Investment Report)
    if (workbook.SheetNames.length > 0) {
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const data = xlsx.utils.sheet_to_json(worksheet)

      logger.info(`Found ${data.length} rows in the first sheet`)

      // Map and store data in the delivery_investment_report table
      const results = await processDeliveryInvestmentReport(data)

      // Create a record of the upload
      await db.DeliveryInvestmentReport.create({
        project_code: req.body.project_code || null, // Optional project association
        uploaded_path: filePath,
        created_by: req.user.id,
      })

      // Return the actual file path with the filename that includes the timestamp
      return res.status(200).json({
        message: "File processed successfully",
        results: {
          deliveryInvestmentReport: results,
        },
        filePath: filePath, // Return the actual file path with timestamp
        fileName: req.file.filename, // Return the actual filename with timestamp
      })
    } else {
      logger.error("No sheets found in the Excel file")
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

    // Resolve the absolute path
    const absolutePath = path.join(__dirname, "../../", filePath)

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      console.error(`File not found: ${absolutePath}`)

      // Try to find the file by searching for files with the original filename
      const originalFileName = path.basename(filePath)
      const directory = path.dirname(absolutePath)

      if (fs.existsSync(directory)) {
        const files = fs.readdirSync(directory)
        // Look for files that end with the original filename (after the timestamp)
        const matchingFile = files.find((file) => file.includes("-" + originalFileName))

        if (matchingFile) {
          const newPath = path.join(directory, matchingFile)
          console.log(`Found matching file: ${newPath}`)

          // Set headers for file download
          res.setHeader("Content-Disposition", `attachment; filename="${originalFileName}"`)
          res.setHeader("Content-Type", "application/octet-stream")

          // Create read stream and pipe to response
          const fileStream = fs.createReadStream(newPath)
          fileStream.pipe(res)
          return
        }
      }

      return res.status(404).json({ error: "File not found" })
    }

    // Get file name from path
    const fileName = path.basename(absolutePath)

    // Set headers for file download
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`)
    res.setHeader("Content-Type", "application/octet-stream")

    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(absolutePath)
    fileStream.pipe(res)

    // Handle errors in the stream
    fileStream.on("error", (error) => {
      console.error(`Error streaming file: ${error.message}`)
      if (!res.headersSent) {
        res.status(500).json({ error: "Error streaming file", details: error.message })
      }
    })
  } catch (error) {
    console.error(`Error downloading file: ${error.message}`)
    res.status(500).json({ error: "Failed to download file", details: error.message })
  }
}

// Track monthly sheet uploads
exports.trackMonthlyUpload = async (req, res) => {
  const { sheet_name, file_name, file_path } = req.body
  const uploaded_by = req.user.id

  try {
    if (!sheet_name || !file_name || !file_path) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    console.log("Received sheet_name:", sheet_name)

    const [sheet] = await db.sequelize.query(`SELECT id FROM Monthly_sheet WHERE sheet_name = ? LIMIT 1`, {
      replacements: [sheet_name], // Replace the placeholder with the actual value
      type: db.Sequelize.QueryTypes.SELECT, // Specify the query type
    })

    console.log(sheet.id)

    if (!sheet) {
      return res.status(400).json({ error: "Invalid sheet name" })
    }

    const sheet_id = sheet.id

    // Proceed with version tracking
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
    console.error("Track upload failed:", error.message)
    res.status(500).json({ error: "Upload tracking failed", details: error.message })
  }
}

// filepath: c:\Users\Shruti.rawat\Desktop\GM Calculator new\GMCalculator_backend_4April2025\src\controllers\monthlyUploadController.js
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
    console.error("Error fetching uploaded sheets:", error.message)
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
    console.error("Error fetching additional costs:", error.message)
    res.status(500).json({ error: "Failed to fetch additional costs", details: error.message })
  }
}

exports.addAdditionalCost = async (req, res) => {
  const { cost_name, cost } = req.body

  // Validate input
  if (!cost_name || !cost) {
    return res.status(400).json({ error: "Both cost_name and cost are required." })
  }

  try {
    // Insert the new additional cost into the database
    const newCost = await db.AdditionalCost.create({
      cost_name,
      cost,
      createdBy: req.user.id, // Save the user ID of the logged-in user
    })

    res.status(201).json(newCost)
  } catch (error) {
    console.error("Error adding additional cost:", error.message)
    res.status(500).json({ error: "Failed to add additional cost", details: error.message })
  }
}

exports.getUSExchangeRate = async (req, res) => {
  try {
    // Fetch the exchange rate from the database with user information
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
    console.error("Error fetching US exchange rate:", error.message)
    res.status(500).json({ error: "Failed to fetch US exchange rate", details: error.message })
  }
}

// exports.addUSExchangeRate = async (req, res) => {
//   const { rate } = req.body;

//   // Validate input
//   if (!rate || isNaN(rate)) {
//     return res.status(400).json({ error: "A valid exchange rate is required." });
//   }

//   try {
//     // Update the exchange rate in the database
//     const updatedRate = await db.sequelize.query(
//       `INSERT INTO usexchangerate (rate) VALUES (?)`,
//       {
//         replacements: [rate],
//         type: db.Sequelize.QueryTypes.INSERT,
//       }
//     );

//     res.status(201).json({ message: "Exchange rate added successfully.", rate });
//   } catch (error) {
//     console.error("Error adding exchange rate:", error.message);
//     res.status(500).json({ error: "Failed to add exchange rate", details: error.message });
//   }
// };

exports.updateUSExchangeRate = async (req, res) => {
  const { rate } = req.body

  // Validate input
  if (!rate || isNaN(rate)) {
    return res.status(400).json({ error: "A valid exchange rate is required." })
  }

  try {
    // Update the exchange rate in the database
    const updatedRate = await db.sequelize.query(`UPDATE usexchangerate SET rate = ?, updatedby = ?`, {
      replacements: [rate, req.user.id], // Save the user ID of the logged-in user
      type: db.Sequelize.QueryTypes.UPDATE,
    })

    res.status(200).json({ message: "Exchange rate updated successfully.", rate })
  } catch (error) {
    console.error("Error updating exchange rate:", error.message)
    res.status(500).json({ error: "Failed to update exchange rate", details: error.message })
  }
}

// Process data for the delivery_investment_report table
async function processDeliveryInvestmentReport(data) {
  let inserted = 0
  let errors = 0

  // Create a transaction to ensure data integrity
  const transaction = await db.sequelize.transaction()

  try {
    for (const row of data) {
      try {
        // Map Excel columns to database fields
        // Adjust the field names based on your actual Excel column headers
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

        console.log("Record to insert:", record)

        // Check if project_code is null and log a warning
        if (!record.project_code) {
          logger.warn(`Missing project_code for record: ${JSON.stringify(record)}`)
        }

        // Insert the record into the database
        await db.sequelize.query(
          `INSERT INTO delivery_investment_report 
          (service_type, account_name, type, delivery_unit, project_code, project_name, 
           engagement_type, staffing_model, employee_id, employee_name, designation, 
           resource_status, technical_involvement) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

    // Commit the transaction if all went well
    await transaction.commit()

    return { inserted, errors }
  } catch (error) {
    // Rollback the transaction if there was an error
    await transaction.rollback()
    logger.error(`Transaction error: ${error.message}`)
    throw error
  }
}

exports.processSalarySheet = async (req, res) => {
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
    logger.info(`Processing salary sheet file: ${filePath}`)

    // Read the Excel file
    const workbook = xlsx.readFile(filePath)
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const data = xlsx.utils.sheet_to_json(worksheet)

    logger.info(`Found ${data.length} rows in the salary sheet`)

    const transaction = await db.sequelize.transaction()

    try {
      let inserted = 0
      let errors = 0

      // Clear existing data to avoid primary key conflicts
      await db.sequelize.query("TRUNCATE TABLE salarySheet", { transaction })

      for (const row of data) {
        try {
          // Parse date string in M/D/YYYY or MM/DD/YYYY format
          let dateOfJoining = null
          const doj = row["Date Of Joining"]
          if (doj) {
            if (typeof doj === "number") {
              // Excel serial date to JS date
              const jsDate = new Date(Math.round((doj - 25569) * 86400 * 1000))
              dateOfJoining = jsDate.toISOString().slice(0, 10) // YYYY-MM-DD
            } else if (typeof doj === "string" && doj.includes("/")) {
              // Parse M/D/YYYY or MM/DD/YYYY
              const parts = doj.split("/")
              if (parts.length === 3) {
                let [month, day, year] = parts
                // Handle 2-digit years if present
                if (year.length === 2) year = "20" + year
                const mm = month.padStart(2, "0")
                const dd = day.padStart(2, "0")
                dateOfJoining = `${year}-${mm}-${dd}`
              } else {
                logger.warn(`Unrecognized date string format: ${doj}`)
              }
            } else {
              logger.warn(`Unrecognized date value: ${doj} (type: ${typeof doj})`)
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
          }

          // Validate required fields
          if (!record.EmployeeCode || !record.EmployeeName || !record.DateOfJoining) {
            logger.warn(`Missing required fields for record: ${JSON.stringify(record)}`)
            errors++
            continue
          }

          // Insert the record into the database
          await db.sequelize.query(
            `INSERT INTO salarySheet 
              (EmployeeCode, EmployeeName, DateOfJoining, CurrentDesignation, Grade, CurrentDepartment, CTC) 
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
            {
              replacements: [
                record.EmployeeCode,
                record.EmployeeName,
                record.DateOfJoining,
                record.CurrentDesignation,
                record.Grade,
                record.CurrentDepartment,
                record.CTC,
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

      // Commit the transaction if all went well
      await transaction.commit()

      // Return the actual file path with the filename that includes the timestamp
      return res.status(200).json({
        message: "Salary sheet processed successfully",
        results: { inserted, errors },
        filePath: filePath, // Return the actual file path with timestamp
        fileName: req.file.filename, // Return the actual filename with timestamp
      })
    } catch (error) {
      // Rollback the transaction if there was an error
      await transaction.rollback()
      logger.error(`Transaction error: ${error.message}`)
      return res.status(500).json({ error: "Error processing file", details: error.message })
    }
  } catch (error) {
    logger.error(`Error processing file: ${error.message}`)
    return res.status(500).json({ error: "Error processing file", details: error.message })
  }
}


exports.processRevenueSheet = async (req, res) => {
  if (!req.file) {
    logger.error("No file uploaded")
    return res.status(400).json({ error: "Please upload an Excel file" })
  }

  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel"
  ]
  if (!allowedTypes.includes(req.file.mimetype)) {
    logger.error(`Invalid file type: ${req.file.mimetype}`)
    return res.status(400).json({ error: "Invalid file type. Please upload an Excel file" })
  }

  try {
    const filePath = req.file.path
    logger.info(`Processing revenue sheet file: ${filePath}`)

    // Read the Excel file
    const workbook = xlsx.readFile(filePath)
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const data = xlsx.utils.sheet_to_json(worksheet)

    logger.info(`Found ${data.length} rows in the revenue sheet`)

    const transaction = await db.sequelize.transaction()

    try {
      let inserted = 0
      let errors = 0

      // Optional: Clear existing data if needed
      // await db.sequelize.query("TRUNCATE TABLE revenue", { transaction })

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

          // Validate required fields
          if (!record.project_id || !record.project_name) {
            logger.warn(`Missing required fields for record: ${JSON.stringify(record)}`)
            errors++
            continue
          }

          await db.sequelize.query(
            `INSERT INTO revenue 
              (service_type, du, project_id, project_name, account_name, revenue) 
              VALUES (?, ?, ?, ?, ?, ?)`,
            {
              replacements: [
                record.service_type,
                record.du,
                record.project_id,
                record.project_name,
                record.account_name,
                record.revenue,
              ],
              transaction,
            }
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
        filePath: filePath,
        fileName: req.file.filename,
      })
    } catch (error) {
      await transaction.rollback()
      logger.error(`Transaction error: ${error.message}`)
      return res.status(500).json({ error: "Error processing file", details: error.message })
    }
  } catch (error) {
    logger.error(`Error processing file: ${error.message}`)
    return res.status(500).json({ error: "Error processing file", details: error.message })
  }
}


exports.calculateInterimCost = async (req, res) => {
  try {
    // Get current month name (e.g., 'April')
    const now = new Date();
    const monthName = now.toLocaleString("en-US", { month: "long" });

    // Insert data into interimcostcalculation with current month
    const [result] = await db.sequelize.query(
      `INSERT INTO interimcostcalculation 
        (ProjectId, EmpId, TechnicalInvolvement, Salary, AdditionalCost, Month)
      SELECT 
        d.project_code AS ProjectId,
        d.employee_id AS EmpId,
        CAST(d.technical_involvement AS DECIMAL(3,2)) AS TechnicalInvolvement,
        ROUND(
          ((CAST(s.CTC AS DECIMAL(10,2)) * 100000) / 12) / 83 * CAST(d.technical_involvement AS DECIMAL(3,2)), 
          2
        ) AS Salary,
        COALESCE((SELECT SUM(ac.cost) FROM additionalcosts ac), 0.00) AS AdditionalCost,
        :monthName AS Month
      FROM 
        delivery_investment_report d
      JOIN 
        salarySheet s 
        ON d.employee_id = s.EmployeeCode;`,
      {
        replacements: { monthName },
        type: db.Sequelize.QueryTypes.INSERT,
      }
    );

    res.status(201).json({ message: "Interim cost calculation completed successfully." });
  } catch (error) {
    console.error("Error calculating interim cost:", error.message);
    res.status(500).json({ error: "Failed to calculate interim cost", details: error.message });
  }
};

exports.calculateInterimProjectGM = async (req, res) => {
  try {
    // Get current month name (e.g., 'April')
    const now = new Date();
    const monthName = now.toLocaleString("en-US", { month: "long" });

    await db.sequelize.query(
      `INSERT INTO interimprojectgm (ProjectId, Revenue, Cost, Month)
       SELECT 
         i.ProjectId, 
         r.revenue AS Revenue,
         SUM(i.TotalCost) AS Cost,
         :monthName AS Month
       FROM 
         interimcostcalculation i
       JOIN 
         revenue r ON i.ProjectId = r.project_id
       WHERE i.Month = :monthName
       GROUP BY 
         i.ProjectId, r.revenue;`,
      { 
        replacements: { monthName },
        type: db.Sequelize.QueryTypes.INSERT 
      }
    );

    res.status(201).json({ message: "Interim Project GM calculation completed successfully." });
  } catch (error) {
    console.error("Error calculating interim project GM:", error.message);
    res.status(500).json({ error: "Failed to calculate interim project GM", details: error.message });
  }
};

exports.getAllInterimProjectGM = async (req, res) => {
  try {
    const data = await db.sequelize.query(
      `SELECT * FROM interimprojectgm ORDER BY Id DESC`,
      { type: db.Sequelize.QueryTypes.SELECT }
    );
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching interim project GM data:", error.message);
    res.status(500).json({ error: "Failed to fetch interim project GM data", details: error.message });
  }
};
