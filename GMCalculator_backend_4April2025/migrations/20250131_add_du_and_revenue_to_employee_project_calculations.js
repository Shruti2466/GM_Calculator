'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Employee_Project_Calculations', 'DU', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Employee_Project_Calculations', 'Revenue', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Employee_Project_Calculations', 'DU');
    await queryInterface.removeColumn('Employee_Project_Calculations', 'Revenue');
  }
};
