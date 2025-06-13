const xlsx = require("xlsx")
const db = require("../models")
const logger = require("../logger")

exports.calculateMetrics = async (financeSheetPath, rmSheetPath, salarySheetPath, projectId) => {
  // Read all three workbooks
  const financeWorkbook = xlsx.readFile(financeSheetPath)
  const rmWorkbook = xlsx.readFile(rmSheetPath)
  const salaryWorkbook = xlsx.readFile(salarySheetPath)

  // Get the first sheet from each workbook
  const financeSheet = financeWorkbook.Sheets[financeWorkbook.SheetNames[0]]
  const rmSheet = rmWorkbook.Sheets[rmWorkbook.SheetNames[0]]
  const salarySheet = salaryWorkbook.Sheets[salaryWorkbook.SheetNames[0]]

  // Convert sheets to JSON
  const financeData = xlsx.utils.sheet_to_json(financeSheet)
  const rmData = xlsx.utils.sheet_to_json(rmSheet)
  const salaryData = xlsx.utils.sheet_to_json(salarySheet)

  // Create maps for each dataset for efficient lookup
  const financeMap = new Map()
  const rmMap = new Map()
  const salaryMap = new Map()

  // Index finance data
  financeData.forEach((row) => {
    const key = `${row.Month}_${row.Year}_${row["Employee ID"]}`
    financeMap.set(key, row)
  })

  // Index RM data
  rmData.forEach((row) => {
    const key = `${row.Month}_${row.Year}_${row["Employee ID"]}`
    rmMap.set(key, row)
  })

  // Index salary data
  salaryData.forEach((row) => {
    const key = `${row.Month}_${row.Year}_${row["Employee Code"]}`
    salaryMap.set(key, row)
  })

  // Combine data only where all three sources have matching records
  const combinedData = []

  // Use finance data as base and look for matching records
  financeData.forEach((financeRow) => {
    const key = `${financeRow.Month}_${financeRow.Year}_${financeRow["Employee ID"]}`
    const rmRow = rmMap.get(key)
    const salaryRow = salaryMap.get(key)

    // Only include if we have matching data from all three sources
    if (rmRow && salaryRow) {
      const combinedRow = {
        Month: financeRow.Month,
        Year: financeRow.Year,
        "Employee ID": financeRow["Employee ID"],
        "Employee Name": rmRow["Employe Name"],
        "Salary Per Annum": salaryRow["Annual CTC"],
        "Project Name": rmRow["Project Name"],
        Designation: rmRow["Designation"],
        Skill: rmRow["Service Type"],
        Revenue: financeRow["Revenue"],
        "Technical Involvement": rmRow["Technical Involvement"],
        "Salary cost": salaryRow["Annual CTC"] / 12, // Monthly salary cost
        "Computer rent": financeRow["Computer rent"],
        "Other cost": financeRow["Other cost"],
        "Sum of Delivery Unit wise Tech OH": financeRow["Sum of Delivery Unit wise Tech OH"],
      }
      combinedData.push(combinedRow)
    }
  })


  // Fetch the DU from the projects table
  const project = await db.Project.findOne({ where: { id: projectId } })
  const DU = project ? project.delivery_unit : null

  // Create a map to store aggregated project metrics by month/year
  const projectMetricsMap = new Map()

  for (const row of combinedData) {
    const technicalInvolvement = row["Technical Involvement"]
    const totalDirectCost =
      (row["Salary cost"] + row["Computer rent"] + row["Other cost"] + row["Sum of Delivery Unit wise Tech OH"]) *
      technicalInvolvement
    const grossMargin = row["Revenue"] * technicalInvolvement - totalDirectCost
    const percentageGrossMargin = (grossMargin / (row["Revenue"] * technicalInvolvement)) * 100
    const revenue = row["Revenue"] * technicalInvolvement

    // Find if the record exists
    const existingRecord = await db.Employee_Project_Calculations.findOne({
      where: {
        employee_id: row["Employee ID"],
        project_id: projectId,
        month: row["Month"],
        year: row["Year"],
      },
    })

    if (existingRecord) {
      // Update the existing record
  
      await db.Employee_Project_Calculations.update(
        {
          total_direct_cost: totalDirectCost,
          gross_margin: grossMargin,
          percentage_gross_margin: percentageGrossMargin,
          Revenue: revenue,
          DU: DU,
          employee_name: row["Employee Name"],
        },
        {
          where: {
            employee_id: row["Employee ID"],
            project_id: projectId,
            month: row["Month"],
            year: row["Year"],
          },
        },
      )
    } else {
      // Insert a new record

      await db.Employee_Project_Calculations.create({
        employee_id: row["Employee ID"],
        employee_name: row["Employee Name"],
        project_id: projectId,
        month: row["Month"],
        year: row["Year"],
        total_direct_cost: totalDirectCost,
        gross_margin: grossMargin,
        percentage_gross_margin: percentageGrossMargin,
        Revenue: revenue,
        DU: DU,
      })
    }

    // Aggregate data for project_metrics table
    const monthYearKey = `${row["Month"]}_${row["Year"]}`
    if (!projectMetricsMap.has(monthYearKey)) {
      projectMetricsMap.set(monthYearKey, {
        month: row["Month"],
        year: row["Year"],
        total_cost: 0,
        total_revenue: 0,
        gross_margin: 0,
        count: 0,
      })
    }

    const metrics = projectMetricsMap.get(monthYearKey)
    metrics.total_cost += totalDirectCost
    metrics.total_revenue += revenue
    metrics.gross_margin += grossMargin
    metrics.count++
  }

  // Save aggregated project metrics
  for (const [key, metrics] of projectMetricsMap.entries()) {
    const percentage_gross_margin = metrics.total_revenue > 0 ? (metrics.gross_margin / metrics.total_revenue) * 100 : 0

    // Check if record exists
    const existingMetrics = await db.Project_Metrics.findOne({
      where: {
        project_id: projectId,
        month: metrics.month,
        year: metrics.year,
      },
    })

    if (existingMetrics) {
      // Update existing record
      await db.Project_Metrics.update(
        {
          total_cost: metrics.total_cost,
          total_revenue: metrics.total_revenue,
          gross_margin: metrics.gross_margin,
          percentage_gross_margin: percentage_gross_margin,
        },
        {
          where: {
            project_id: projectId,
            month: metrics.month,
            year: metrics.year,
          },
        },
      )
    } else {
      // Create new record
      await db.Project_Metrics.create({
        project_id: projectId,
        month: metrics.month,
        year: metrics.year,
        total_cost: metrics.total_cost,
        total_revenue: metrics.total_revenue,
        gross_margin: metrics.gross_margin,
        percentage_gross_margin: percentage_gross_margin,
      })
    }
  }

  return "Data calculated and updated successfully"
}
