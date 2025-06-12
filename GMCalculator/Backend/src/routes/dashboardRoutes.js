const express = require("express")
const router = express.Router()
const {
  getOrganizationMetrics,
  getProjectTrends,
  getDuList,
  getInterimProjectMetrics,
  getAvailableMonths,
} = require("../controllers/dashboardController")
const authenticateToken = require("../middlewares/authMiddleware")
 
router.get("/organization-metrics/:deliveryUnit", authenticateToken, getOrganizationMetrics)
router.get("/project-trends/:deliveryUnit", authenticateToken, getProjectTrends)
router.get("/dulist/", authenticateToken, getDuList)
 
module.exports = router