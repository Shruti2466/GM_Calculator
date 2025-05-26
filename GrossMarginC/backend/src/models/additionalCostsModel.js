module.exports = (sequelize, DataTypes) => {
    const AdditionalCost = sequelize.define(
      "AdditionalCost",
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        cost_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        cost: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        createdAt: {
          type: DataTypes.DATE,
          field: "createdat",
          defaultValue: DataTypes.NOW,
        },
        createdBy: {
          type: DataTypes.INTEGER,
          field: "createdby",
          allowNull: true,
        },
        updatedAt: {
          type: DataTypes.DATE,
          field: "updatedat",
          defaultValue: DataTypes.NOW,
        },
        updatedBy: {
          type: DataTypes.INTEGER,
          field: "updatedby",
          allowNull: true,
        },
      },
      {
        tableName: "additionalcosts",
        timestamps: true, // Enable Sequelize timestamps
        createdAt: "createdAt", // Map to the database field
        updatedAt: "updatedAt", // Map to the database field
      }
    );
  
    AdditionalCost.associate = (models) => {
      AdditionalCost.belongsTo(models.User, {
        foreignKey: "createdBy",
        as: "creator",
      });
      AdditionalCost.belongsTo(models.User, {
        foreignKey: "updatedBy",
        as: "updater",
      });
    };
  
    return AdditionalCost;
  };