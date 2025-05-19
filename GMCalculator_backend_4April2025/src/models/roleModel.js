module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define(
    "Role",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      role_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: "roles",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  )

  Role.associate = (models) => {
    Role.hasMany(models.User, { foreignKey: "role_id" })
  }

  return Role
}
