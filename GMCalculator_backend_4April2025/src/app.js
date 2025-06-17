require("dotenv").config()
const express = require("express")
const db = require("./models")
const authRoutes = require("./routes/authRoutes")
const projectRoutes = require("./routes/projectRoutes")
const swaggerDocument = require("../swagger.json")
const swaggerUi = require("swagger-ui-express")
const cors = require("cors")
const dashboardRoutes = require("./routes/dashboardRoutes")
const employeeRoutes = require("./routes/employeeRoutes")
const roleRoutes = require("./routes/roleRoutes")
const logger = require("./logger")
const monthlyUploadRoutes = require("./routes/monthlyUploadRoutes")
const interimDashboardRoutes = require("./routes/interimDashboardRoutes")
const userRoutes = require("./routes/userRoutes")

const app = express()

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:4000",
    credentials: true,
  }),
)

app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))

app.use("/api/auth", authRoutes)
app.use("/api/projects", projectRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/employee", employeeRoutes)
app.use("/api/roles", roleRoutes)
app.use("/uploads", express.static("uploads"))
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.use("/api/upload/monthly-data", monthlyUploadRoutes)
app.use("/api/interim-dashboard", interimDashboardRoutes)
app.use("/api/users", userRoutes)

app.use((err, req, res, next) => {
  logger.error(err.stack)
  res.status(500).json({ error: "Something went wrong!" })
})

const PORT = process.env.PORT || 3001

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

module.exports = app
