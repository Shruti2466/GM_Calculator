require("dotenv").config()
const express = require("express")
const db = require("./models")
const authRoutes = require("./routes/authRoutes")
const projectRoutes = require("./routes/projectRoutes")
const swaggerDocument = require("../swagger.json") // Path to swagger.json
const swaggerUi = require("swagger-ui-express")
const cors = require("cors")
const dashboardRoutes = require("./routes/dashboardRoutes")
const employeeRoutes = require("./routes/employeeRoutes")
const roleRoutes = require("./routes/roleRoutes")
const logger = require("./logger")
const monthlyUploadRoutes = require('./routes/monthlyUploadRoutes');
const interimDashboardRoutes = require("./routes/interimDashboardRoutes") // Add this line



const app = express()
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:4000"],
    credentials: true,
  })
);


app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))
app.use("/api/auth", authRoutes)
app.use("/api/projects", projectRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/employee", employeeRoutes)
app.use("/api/roles", roleRoutes)

// Serve static files from the uploads directory
app.use("/uploads", express.static("uploads"))

// Swagger setup
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.use('/api/upload/monthly-data', monthlyUploadRoutes);
app.use("/api/interim-dashboard", interimDashboardRoutes) // Add this line

const PORT = process.env.PORT || 8000

db.sequelize
  .sync()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
    })
  })
  .catch((err) => {
    logger.error("Unable to connect to the database:", err)
  })
