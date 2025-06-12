module.exports = (sequelize, DataTypes) => {
  const InterimCostCalculation = sequelize.define("interimcostcalculation", {
    Id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ProjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    EmpId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    TechnicalInvolvement: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
    },
    Salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    AdditionalCost: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    Month: {
      type: DataTypes.STRING(7), // Changed to support mm/yyyy format
      allowNull: false,
    },
    TotalCost: {
      type: DataTypes.VIRTUAL,
      get() {
        return (parseFloat(this.Salary) + parseFloat(this.AdditionalCost)).toFixed(2);
      }
    }
  }, {
    tableName: "interimcostcalculation",
    timestamps: false,
  });

  return InterimCostCalculation;
};