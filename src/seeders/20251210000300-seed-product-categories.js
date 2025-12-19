"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("product_categories", [
      {
        name: "Món chính",
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Món khai vị",
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Đồ uống",
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("product_categories", null, {});
  },
};
