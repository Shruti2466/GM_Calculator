const express = require("express")
const router = express.Router()
const {
  getAllProjects,
  createProject,
  uploadFileAndCalculate,
  editProject,
  deleteProject,
  getProjectChartData,
  getUploadedFiles,
} = require("../controllers/projectController")
const authenticateToken = require("../middlewares/authMiddleware")
const multer = require("multer")
const upload = multer({ dest: "uploads/" })

router.get("/", authenticateToken, getAllProjects)
router.post("/", authenticateToken, createProject)
router.put("/:id", authenticateToken, editProject)
router.delete("/:id", authenticateToken, deleteProject)
router.post(
  "/:id/upload",
  authenticateToken,
  upload.fields([
    { name: "file1", maxCount: 1 },
    { name: "file2", maxCount: 1 },
    { name: "file3", maxCount: 1 },
  ]),
  uploadFileAndCalculate,
)
router.get("/:id/chart-data", authenticateToken, getProjectChartData)
router.get("/auditlist", getUploadedFiles)

module.exports = router
