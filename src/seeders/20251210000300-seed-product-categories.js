"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "product_categories",
      [
        {
          id: 1,
          name: "Món chính",
          status: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: "Món khai vị",
          status: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 3,
          name: "Đồ uống",
          status: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("product_categories", null, {});
  },
};
