const logger = require("../logger")
const db = require("../models")
const { extractEmailFromToken } = require("../utils/jwtUtils")

// Helper function to get financial year from month_year
const getFinancialYear = (monthYear) => {
  const [month, year] = monthYear.split('/').map(Number);
  
  if (month >= 4) {
    // April to December: FY starts in current year
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    // January to March: FY started in previous year
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
};

// Helper function to check if month_year falls within financial year
const isInFinancialYear = (monthYear, financialYear) => {
  const [month, year] = monthYear.split('/').map(Number);
  const [startYear, endYear] = financialYear.split('-').map((y, i) => 
    i === 0 ? Number(y) : Number(`20${y}`)
  );
  
  // Check if month/year falls between April startYear and March endYear
  if (year === startYear && month >= 4) return true;
  if (year === endYear && month <= 3) return true;
  if (year > startYear && year < endYear) return true;
  
  return false;
};

// CORRECTED: Helper function to build financial year filter with validation

const buildFinancialYearFilter = (financialYear, month = null) => {

  
  // Validate financialYear parameter
  if (!financialYear || financialYear === "all" || financialYear === "undefined") {
    return "";
  }
  
  // Validate financialYear format (should be like "2025-26")
  if (typeof financialYear !== 'string' || !financialYear.includes('-')) {
    console.error("Invalid financial year format:", financialYear)
    return "";
  }
  
  const yearParts = financialYear.split('-');
  if (yearParts.length !== 2) {
    console.error("Invalid financial year format - should be 'YYYY-YY':", financialYear)
    return "";
  }
  
  const [startYear, endYear] = yearParts.map((y, i) => 
    i === 0 ? Number(y) : Number(`20${y}`)
  );
  
  // Validate parsed years
  if (isNaN(startYear) || isNaN(endYear)) {
    console.error("Invalid year values after parsing:", { startYear, endYear })
    return "";
  }
  

  
  // If specific month is selected
  if (month && month !== "all" && month !== "YTD") {
    const monthNum = Number(month);
    
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      console.error("Invalid month number:", month)
      return "";
    }
    
    // Determine which year the month belongs to in the financial year
    let targetYear;
    if (monthNum >= 4) {
      // April to December belongs to start year
      targetYear = startYear;

    } else {
      // January to March belongs to end year
      targetYear = endYear;

    }
    
    // CORRECTED: Use proper month/year format matching your database
    const filter = `AND ipg.month_year = '${monthNum.toString().padStart(2, '0')}/${targetYear}'`;

    return filter;
  }
  
  // CORRECTED: For "all" months or "YTD" in the financial year
  // Your database stores month_year as "MM/YYYY" format, so we need to match this pattern
  let timeFilter = `AND (
    (SUBSTRING_INDEX(ipg.month_year, '/', -1) = '${startYear}' AND SUBSTRING_INDEX(ipg.month_year, '/', 1) >= '04') OR
    (SUBSTRING_INDEX(ipg.month_year, '/', -1) = '${endYear}' AND SUBSTRING_INDEX(ipg.month_year, '/', 1) <= '03')
  )`;
  

  
  // Additional YTD constraint - only up to current month
  if (month === "YTD") {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    

    
    // Convert current month to MM format for comparison
    const currentMonthStr = currentMonth.toString().padStart(2, '0');
    
    if (currentYear === endYear && currentMonth <= 3) {
      // We're in Jan-Mar of the end year, include all months from start year + months up to current in end year
      timeFilter += ` AND (
        (SUBSTRING_INDEX(ipg.month_year, '/', -1) = '${startYear}') OR
        (SUBSTRING_INDEX(ipg.month_year, '/', -1) = '${endYear}' AND SUBSTRING_INDEX(ipg.month_year, '/', 1) <= '${currentMonthStr}')
      )`;
    } else if (currentYear === startYear && currentMonth >= 4) {
      // We're in Apr-Dec of the start year, only include months from April up to current month
      timeFilter += ` AND (
        SUBSTRING_INDEX(ipg.month_year, '/', -1) = '${startYear}' AND 
        SUBSTRING_INDEX(ipg.month_year, '/', 1) >= '04' AND 
        SUBSTRING_INDEX(ipg.month_year, '/', 1) <= '${currentMonthStr}'
      )`;
    }
    
    
  }
  

  return timeFilter;
};

// Get Organization-wide Metrics with Financial Year filtering
const getInterimOrganizationMetrics = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1]
    const { role, email } = await extractEmailFromToken(token)

    const employee = await db.Employee.findOne({ where: { employee_email: email } })
    if (!employee) return res.status(404).send("Employee not found")
    const { id: employeeTableId } = employee

    const deliveryUnit = req.params.deliveryUnit || req.query.deliveryUnit
    const month = req.params.month || req.query.month
    const financialYear = req.params.financialYear || req.query.financialYear

    // Validate required parameters
    if (!financialYear || financialYear === "undefined") {
      return res.status(400).json({
        error: "Financial year parameter is required",
        details: "Please provide a valid financial year",
      })
    }

    const filters = []
    
    // Add delivery unit filter
    if (deliveryUnit !== "all") {
      filters.push(`p.delivery_unit = '${deliveryUnit}'`)
    }

    // Add role-based filter
    if (role !== "Admin") {
      filters.push(`(p.delivery_manager_id = ${employeeTableId} OR p.delivery_head_id = ${employeeTableId})`)
    }
    
    // Build financial year filter
    const timeFilter = buildFinancialYearFilter(financialYear, month);
    
    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")} ${timeFilter}` : 
                       timeFilter ? `WHERE ${timeFilter.replace('AND ', '')}` : "";

    const query = `
      SELECT 
        COALESCE(SUM(ipg.Revenue), 0) AS total_revenue,
        COALESCE(SUM(ipg.Cost), 0) AS total_cost,
        COALESCE(SUM(ipg.GM), 0) AS total_gm,
        CASE WHEN SUM(ipg.Revenue) > 0 
             THEN (SUM(ipg.GM) / SUM(ipg.Revenue)) * 100 
             ELSE 0 
        END AS gm_percentage
      FROM interimprojectgm ipg
      JOIN projects p ON ipg.ProjectId = p.project_code
      ${whereClause}
    `

    const results = await db.sequelize.query(query, { type: db.Sequelize.QueryTypes.SELECT })

    const response = results[0] || {
      total_revenue: 0,
      total_cost: 0,
      total_gm: 0,
      gm_percentage: 0,
    }
    res.json(response)
  } catch (error) {
    console.error("Error in getInterimOrganizationMetrics:", error)
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
      total_revenue: 0,
      total_cost: 0,
      total_gm: 0,
      gm_percentage: 0,
    })
  }
}

// Update project trends with corrected filtering and validation
const getInterimProjectTrends = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1]
    const { role, email } = await extractEmailFromToken(token)

    const employee = await db.Employee.findOne({ where: { employee_email: email } })
    if (!employee) return res.status(404).send("Employee not found")
    const { id: employeeTableId } = employee

    const deliveryUnit = req.params.deliveryUnit || req.query.deliveryUnit
    const month = req.params.month || req.query.month
    const financialYear = req.params.financialYear || req.query.financialYear


    // Validate required parameters
    if (!financialYear || financialYear === "undefined") {
      return res.status(400).json({
        error: "Financial year parameter is required",
        details: "Please provide a valid financial year",
      })
    }

    const filters = []
    
    // Add delivery unit filter
    if (deliveryUnit !== "all") {
      filters.push(`p.delivery_unit = '${deliveryUnit}'`)
    }

    // Add role-based filter
    if (role !== "Admin") {
      filters.push(`(p.delivery_manager_id = ${employeeTableId} OR p.delivery_head_id = ${employeeTableId})`)
    }
    
    // Build financial year filter
    const timeFilter = buildFinancialYearFilter(financialYear, month);
    
    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")} ${timeFilter}` : 
                       timeFilter ? `WHERE ${timeFilter.replace('AND ', '')}` : "";

    const query = `
      SELECT 
        ipg.month_year AS month,
        COALESCE(SUM(ipg.Revenue), 0) AS total_revenue,
        COALESCE(SUM(ipg.Cost), 0) AS total_cost,
        COALESCE(SUM(ipg.GM), 0) AS total_gm,
        CASE WHEN SUM(ipg.Revenue) > 0 
             THEN (SUM(ipg.GM) / SUM(ipg.Revenue)) * 100 
             ELSE 0 
        END AS gm_percentage
      FROM interimprojectgm ipg
      JOIN projects p ON ipg.ProjectId = p.project_code
      ${whereClause}
      GROUP BY ipg.month_year
      ORDER BY STR_TO_DATE(ipg.month_year, '%m/%Y') DESC
    `

    const results = await db.sequelize.query(query, { type: db.Sequelize.QueryTypes.SELECT })
    
    res.json(results)
  } catch (error) {
    console.error("Error in getInterimProjectTrends:", error)
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    })
  }
}

// Update project details table with validation
// Update project details table with corrected column names
const getProjectDetailsTable = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1]
    const { role, email } = await extractEmailFromToken(token)

    const employee = await db.Employee.findOne({ where: { employee_email: email } })
    if (!employee) return res.status(404).send("Employee not found")
    const { id: employeeTableId } = employee

    const deliveryUnit = req.params.deliveryUnit || req.query.deliveryUnit
    const month = req.params.month || req.query.month
    const financialYear = req.params.financialYear || req.query.financialYear


    // Validate required parameters
    if (!financialYear || financialYear === "undefined") {
      console.error("Missing or invalid financial year parameter")
      return res.status(400).json({
        error: "Financial year parameter is required",
        details: "Please provide a valid financial year",
      })
    }

    const filters = []
    
    // Add delivery unit filter
    if (deliveryUnit !== "all") {
      filters.push(`p.delivery_unit = '${deliveryUnit}'`)
    }

    // Add role-based filter
    if (role !== "Admin") {
      filters.push(`(p.delivery_manager_id = ${employeeTableId} OR p.delivery_head_id = ${employeeTableId})`)
    }
    
    // Build financial year filter
    const timeFilter = buildFinancialYearFilter(financialYear, month);
    
    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")} ${timeFilter}` : 
                       timeFilter ? `WHERE ${timeFilter.replace('AND ', '')}` : "";

    // Determine grouping based on month selection - CORRECTED COLUMN NAMES
    const groupBy = month !== "all" && month !== "YTD"
      ? `p.project_code, p.project_name, p.delivery_unit, p.account_name, ipg.month_year, dm.employee_name, dh.employee_name`
      : `p.project_code, p.project_name, p.delivery_unit, p.account_name, dm.employee_name, dh.employee_name`

    const selectMonth = (month !== "all" && month !== "YTD") ? "ipg.month_year," : ""

    // CORRECTED: Use employee_name instead of name
    const query = `
      SELECT 
        p.project_name,
        p.project_code,
        p.delivery_unit,
        p.account_name,
        ${selectMonth}
        SUM(ipg.Revenue) AS total_revenue,
        SUM(ipg.Cost) AS total_cost,
        SUM(ipg.GM) AS total_gm,
        CASE WHEN SUM(ipg.Revenue) > 0 
             THEN (SUM(ipg.GM) / SUM(ipg.Revenue)) * 100 
             ELSE 0 
        END AS gm_percentage,
        COALESCE(dm.employee_name, 'Not Assigned') AS delivery_manager_name,
        COALESCE(dh.employee_name, 'Not Assigned') AS delivery_head_name
      FROM interimprojectgm ipg
      JOIN projects p ON ipg.ProjectId = p.project_code
      LEFT JOIN employees dm ON p.delivery_manager_id = dm.id
      LEFT JOIN employees dh ON p.delivery_head_id = dh.id
      ${whereClause}
      GROUP BY ${groupBy}
      ORDER BY p.project_name ${(month !== "all" && month !== "YTD") ? ", STR_TO_DATE(ipg.month_year, '%m/%Y') DESC" : ""}
    `

    const results = await db.sequelize.query(query, { type: db.Sequelize.QueryTypes.SELECT })

   
    res.json(results)
  } catch (error) {
    console.error("Error in getProjectDetailsTable:", error)
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    })
  }
}

// Helper function to get current financial year
const getCurrentFinancialYear = () => {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  
  if (currentMonth >= 4) {
    return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
  } else {
    return `${currentYear - 1}-${currentYear.toString().slice(-2)}`
  }
}

// Updated getAvailableMonths to return financial years
const getAvailableMonths = async (req, res) => {
  try {
    const results = await db.sequelize.query(
      `SELECT DISTINCT ipg.month_year AS month_year 
       FROM interimprojectgm ipg 
       WHERE ipg.month_year IS NOT NULL 
       ORDER BY STR_TO_DATE(ipg.month_year, '%m/%Y') DESC`,
      { type: db.Sequelize.QueryTypes.SELECT },
    )



    const monthYearList = results.map((r) => r.month_year)

    // Get unique months (1-12)
    const months = Array.from(
      new Set(
        monthYearList.map((m) => {
          const parts = m.split("/")
          return parts[0]
        }),
      ),
    ).sort((a, b) => Number.parseInt(a) - Number.parseInt(b))

    // Generate financial years from the data
    const financialYears = Array.from(
      new Set(
        monthYearList.map((m) => getFinancialYear(m))
      )
    ).sort((a, b) => {
      const aStart = Number(a.split('-')[0]);
      const bStart = Number(b.split('-')[0]);
      return bStart - aStart; // Most recent first
    });

    // Get current financial year
    const currentFY = getCurrentFinancialYear()



    res.json({ 
      months, 
      financialYears,
      currentFinancialYear: currentFY // Send current FY to frontend
    })
  } catch (error) {
    console.error("Error in getAvailableMonths:", error)
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
      months: [],
      financialYears: [],
      currentFinancialYear: getCurrentFinancialYear()
    })
  }
}

// Keep other functions unchanged
const getMonthlyAggregatedData = async (req, res) => {
  try {
    const query = `
      SELECT 
        ipg.month_year,
        COALESCE(SUM(ipg.Revenue), 0) AS total_revenue,
        COALESCE(SUM(ipg.Cost), 0) AS total_cost,
        COALESCE(SUM(ipg.GM), 0) AS total_gm,
        CASE WHEN SUM(ipg.Revenue) > 0 
             THEN (SUM(ipg.GM) / SUM(ipg.Revenue)) * 100 
             ELSE 0 
        END AS gm_percentage
      FROM interimprojectgm ipg
      WHERE ipg.month_year IS NOT NULL
      GROUP BY ipg.month_year
      ORDER BY STR_TO_DATE(ipg.month_year, '%m/%Y') DESC
    `

    const results = await db.sequelize.query(query, { type: db.Sequelize.QueryTypes.SELECT }) 
    res.json(results)
  } catch (error) {
    console.error("Error in getMonthlyAggregatedData:", error)
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    })
  }
}

module.exports = {
  getInterimOrganizationMetrics,
  getAvailableMonths,
  getInterimProjectTrends,
  getMonthlyAggregatedData,
  getProjectDetailsTable,
}
