const xlsx = require("xlsx")
const db = require("../models")
const logger = require("../logger")

exports.calculateMetrics = async (filePath, filePath2, projectId) => {
  const workbook = xlsx.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = xlsx.utils.sheet_to_json(sheet)

  // Fetch the DU from the projects table
  const project = await db.Project.findOne({ where: { id: projectId } })
  const DU = project ? project.delivery_unit : null

  for (const row of data) {
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
  }
  return "Data calculated and updated successfully"
}
