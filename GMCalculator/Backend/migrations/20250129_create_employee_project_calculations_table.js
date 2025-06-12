'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Employee_Project_Calculations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      employee_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      total_direct_cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      gross_margin: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      percentage_gross_margin: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Employee_Project_Calculations');
  }
};
