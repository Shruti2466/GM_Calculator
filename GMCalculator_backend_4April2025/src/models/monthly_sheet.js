module.exports = (sequelize, DataTypes) => {
    const MonthlySheet = sequelize.define("monthly_sheet", {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
        },
        sheet_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    });

    return MonthlySheet;
};