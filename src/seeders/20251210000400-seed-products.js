"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("products", [
      {
        product_code: "PC1001",
        name: "Bún bò Huế đặc biệt",
        price: 45000,
        sale_price: 40000,
        image: "https://example.com/bunbohue.jpg",
        description: "Món đặc sản nổi tiếng của Huế",
        status: 1,
        categories_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        product_code: "PC1002",
        name: "Gỏi cuốn tôm thịt",
        price: 30000,
        sale_price: 28000,
        image: "https://example.com/goicuon.jpg",
        description: "Món khai vị tươi ngon, thanh mát",
        status: 1,
        categories_id: 2,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("products", null, {});
  },
};
