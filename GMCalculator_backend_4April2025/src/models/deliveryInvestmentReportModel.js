module.exports = (sequelize, DataTypes) => {
    const DeliveryInvestmentReport = sequelize.define(
      "DeliveryInvestmentReport",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        service_type: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        account_name: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        type: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        delivery_unit: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        project_code: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        project_name: {
          type: DataTypes.STRING(150),
          allowNull: true,
        },
        engagement_type: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        staffing_model: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        employee_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        employee_name: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        designation: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        resource_status: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        technical_involvement: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
          },
          updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
          },
      },
      {
        tableName: "delivery_investment_report",
      timestamps: true, // Enable Sequelize's automatic timestamps
      createdAt: "created_at",
      updatedAt: "updated_at",
      },
    )
  
    return DeliveryInvestmentReport
  }
  