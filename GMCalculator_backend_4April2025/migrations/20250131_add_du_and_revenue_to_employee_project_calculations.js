'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('employee_project_calculations', 'DU', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('employee_project_calculations', 'Revenue', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('employee_project_calculations', 'DU');
    await queryInterface.removeColumn('employee_project_calculations', 'Revenue');
  }
};
