const express = require("express")
const router = express.Router()
const employeeController = require("../controllers/employeeController") // Using the same controller
const authenticateToken = require("../middlewares/authMiddleware")
// Employee routes
router.get("/", authenticateToken, employeeController.getAllEmployees)
router.get("/:id", authenticateToken, employeeController.getEmployeeById)
router.post("/", authenticateToken, employeeController.createEmployee)
router.put("/:id", authenticateToken, employeeController.updateEmployee)
router.delete("/:id", authenticateToken, employeeController.deleteEmployee)
router.get("/role/dm", authenticateToken, employeeController.getDMs)
router.get("/role/dh", authenticateToken, employeeController.getDHs)

module.exports = router
