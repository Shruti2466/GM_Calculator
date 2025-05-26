module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define(
    "Project",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      project_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      engagement_type: {
        type: DataTypes.STRING,
      },
      staffingmodel: {
        type: DataTypes.STRING,
      },
      service_type: {
        type: DataTypes.STRING,
      },
      delivery_unit: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      account_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      project_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      delivery_manager_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      delivery_head_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      timestamps: true, // ✅ This handles createdAt and updatedAt
    }
  );

  return Project;
};
