module.exports = (sequelize, DataTypes) => {
  const EmployeeProjectCalculations = sequelize.define(
    "Employee_Project_Calculations",
    {
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      employee_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "projects",
          key: "id",
        },
      },
      month: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      total_direct_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      gross_margin: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      percentage_gross_margin: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      DU: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      Revenue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
    },
    {
      tableName: "Employee_Project_Calculations",
      timestamps: false,
    },
  )

  EmployeeProjectCalculations.associate = (models) => {
    // associations can be defined here
    EmployeeProjectCalculations.belongsTo(models.Project, { foreignKey: "project_id" })
  }

  return EmployeeProjectCalculations
}
