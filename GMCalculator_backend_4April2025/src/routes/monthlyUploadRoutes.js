const express = require("express");
const router = express.Router();
const { uploadMonthlyData, trackMonthlyUpload, getAllUploadedSheets, getAdditionalCosts, addAdditionalCost, getUSExchangeRate, updateUSExchangeRate, downloadFile, processSalarySheet, processRevenueSheet, calculateInterimCost, calculateInterimProjectGM, getAllInterimProjectGM, updateAdditionalCost} = require("../controllers/monthlyUploadController"); // Import trackMonthlyUpload
const authenticateToken = require("../middlewares/authMiddleware");
const multer = require("multer");
const path = require("path");

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads/monthly-data"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + file.originalname;
    cb(null, uniqueSuffix);
  },
});

const upload = multer({ storage: storage })

// Route for uploading monthly data
router.post("/", authenticateToken, upload.single("file"), uploadMonthlyData);

// Protected route (requires JWT token)
router.post(
  "/track-upload",
  authenticateToken, // Reuse auth middleware
  trackMonthlyUpload // Use the imported function
);

router.get("/uploaded-sheets", getAllUploadedSheets);

router.get("/additional-costs", getAdditionalCosts);

router.post("/additional-costs", authenticateToken, addAdditionalCost);

router.put("/additional-costs/:id", authenticateToken, updateAdditionalCost);

router.get("/exchange-rate/usd", getUSExchangeRate);

// router.post("/exchange-rate/usd", addUSExchangeRate);
router.put("/exchange-rate/usd", authenticateToken, updateUSExchangeRate);

router.post("/salary-sheet", authenticateToken, upload.single("file"), processSalarySheet);

router.post("/revenue-sheet", upload.single("file"), authenticateToken, processRevenueSheet);

router.post("/interim-cost", authenticateToken, calculateInterimCost);
router.post("/interim-project-gm", authenticateToken, calculateInterimProjectGM);
router.get("/interim-project-gm", authenticateToken, getAllInterimProjectGM);
router.post("/download", downloadFile)
module.exports = router;