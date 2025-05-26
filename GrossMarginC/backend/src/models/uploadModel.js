module.exports = (sequelize, DataTypes) => {
  const Upload = sequelize.define(
    "Upload",
    {
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "projects",
          key: "id",
        },
      },
      uploaded_path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "uploads",
      timestamps: false,
    },
  )

  Upload.associate = (models) => {
    // associations can be defined here
    Upload.belongsTo(models.Project, { foreignKey: "project_id" })
  }

  return Upload
}
