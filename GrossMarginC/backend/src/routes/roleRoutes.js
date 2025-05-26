const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");

// Get all roles
router.get("/", roleController.getAllRoles);

module.exports = router;