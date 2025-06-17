const express = require("express")
const router = express.Router()
const userController = require("../controllers/userController")
const authenticateToken = require("../middlewares/authMiddleware")

// Admin-only route to create user and employee
router.post("/admin/create", authenticateToken, userController.createUserAndEmployee)

// Other user routes
router.get("/", authenticateToken, userController.getAllUsers)
router.get("/:id", authenticateToken, userController.getUserById)
router.put("/:id", authenticateToken, userController.updateUser)
router.delete("/:id", authenticateToken, userController.deleteUser)

module.exports = router
