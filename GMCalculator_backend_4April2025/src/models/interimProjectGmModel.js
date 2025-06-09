module.exports = (sequelize, DataTypes) => {
  const InterimProjectGM = sequelize.define(
    "InterimProjectGM",
    {
      Id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: "Id",
      },
      ProjectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "ProjectId",
      },
      Revenue: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        field: "Revenue",
      },
      Cost: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        field: "Cost",
      },
      GM: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        field: "GM",
      },
      month_year: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "",
        field: "month_year",
      },
    },
    {
      tableName: "interimprojectgm",
      timestamps: false,
    }
  )

  InterimProjectGM.associate = (models) => {
    InterimProjectGM.belongsTo(models.Project, {
      foreignKey: "ProjectId",
      targetKey: "project_code",
      as: "project",
    })
  }

  return InterimProjectGM
}
