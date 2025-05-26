module.exports = (sequelize, DataTypes) => {
  const ProjectMetrics = sequelize.define(
    "Project_Metrics",
    {
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      total_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      total_revenue: {
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
    },
    {
      tableName: "project_metrics",
      timestamps: false,
    },
  )

  ProjectMetrics.associate = (models) => {
    ProjectMetrics.belongsTo(models.Project, { foreignKey: "project_id" })
  }

  return ProjectMetrics
}
