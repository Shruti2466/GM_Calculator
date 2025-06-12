const express = require("express")
const router = express.Router()
const {
  getInterimOrganizationMetrics,
  getAvailableMonths,
  getInterimProjectTrends,
  getMonthlyAggregatedData,
  getProjectDetailsTable,
} = require("../controllers/interimDashboardController")
const authenticateToken = require("../middlewares/authMiddleware")

// Organization metrics route - support both path and query parameters
router.get("/organization-metrics/:deliveryUnit/:month", authenticateToken, getInterimOrganizationMetrics)
router.get("/organization-metrics", authenticateToken, getInterimOrganizationMetrics)

// Available months route
router.get("/available-months", authenticateToken, getAvailableMonths)

// Project trends route - support both path and query parameters
router.get("/project-trends/:deliveryUnit/:month", authenticateToken, getInterimProjectTrends)
router.get("/project-trends", authenticateToken, getInterimProjectTrends)

// Monthly aggregated data route
router.get("/monthly-aggregated", authenticateToken, getMonthlyAggregatedData)

// Project details table route - support both path and query parameters
router.get("/project-details/:deliveryUnit/:month", authenticateToken, getProjectDetailsTable)
router.get("/project-details", authenticateToken, getProjectDetailsTable)

module.exports = router
