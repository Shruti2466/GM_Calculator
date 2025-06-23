const { Sequelize } = require("sequelize")
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: "mysql",
  logging: false, // Disables logging of SQL queries
})

const db = {}
db.Sequelize = Sequelize
db.sequelize = sequelize

db.User = require("./userModel")(sequelize, Sequelize)
db.Role = require("./roleModel")(sequelize, Sequelize)
db.Project = require("./projectModel")(sequelize, Sequelize)
db.Upload = require("./uploadModel.js")(sequelize, Sequelize)
db.Employee = require("./employeeModel.js")(sequelize, Sequelize)
db.employee_project_calculations = require("./employee_project_calculations.js")(sequelize, Sequelize)
db.Project_Metrics = require("./projectMetricsModel.js")(sequelize, Sequelize)
db.DeliveryInvestmentReport = require("./deliveryInvestmentReportModel.js")(sequelize, Sequelize)
db.monthly_uploaded_sheets = require("./monthly_uploaded_sheets.js")(sequelize, Sequelize)
db.monthly_sheet = require("./monthly_sheet.js")(sequelize, Sequelize)
db.AdditionalCost = require("./additionalCostsModel")(sequelize, Sequelize);
db.InterimProjectGM = require("./interimProjectGmModel.js")(sequelize, Sequelize)
db.InterimCostCalculationModel = require("./InterimCostCalculationModel.js")(sequelize, Sequelize)

// Set up associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

module.exports = db
