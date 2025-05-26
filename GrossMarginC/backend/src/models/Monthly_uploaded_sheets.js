module.exports = (sequelize, DataTypes) => {
    const Monthly_uploaded_sheets = sequelize.define(
      "Monthly_uploaded_sheets",
      {
        sheet_id: { type: DataTypes.STRING(50), allowNull: false },
        version: { type: DataTypes.INTEGER, allowNull: false },
        file_name: { type: DataTypes.STRING(255), allowNull: false },
        file_path: { type: DataTypes.STRING(255), allowNull: false },
        uploaded_by: { type: DataTypes.INTEGER, allowNull: false },
        is_current: { type: DataTypes.TINYINT(1), allowNull: false, defaultValue: 1 }, // Updated
      },
      {
        timestamps: false,
        indexes: [
          { unique: true, fields: ["sheet_id", "version"] },
          
        ],
      }
    );
   
    Monthly_uploaded_sheets.associate = (models) => {
      Monthly_uploaded_sheets.belongsTo(models.User, {
        foreignKey: "uploaded_by",
        as: "uploader",
      });
      Monthly_uploaded_sheets.belongsTo(models.Monthly_sheet, {
        foreignKey: "sheet_id",
        targetKey: "id",
      });
    };
   
    return Monthly_uploaded_sheets;
  };
   