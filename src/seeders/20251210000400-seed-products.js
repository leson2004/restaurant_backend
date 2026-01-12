"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("products", [
      {
        product_code: "PC1001",
        name: "Bún bò Huế đặc biệt",
        price: 45000,
        sale_price: 40000,
        image:
          "https://firebasestorage.googleapis.com/v0/b/huong-sen-restaurant.appspot.com/o/images%2Funnamed.jpg",
        description: "Món đặc sản nổi tiếng của Huế",
        status: 1,
        categories_id: 1, // 👉 PHẢI TỒN TẠI trong product_categories
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        product_code: "PC1002",
        name: "Gỏi cuốn tôm thịt",
        price: 30000,
        sale_price: 28000,
        image:
          "https://firebasestorage.googleapis.com/v0/b/huong-sen-restaurant.appspot.com/o/images%2FScreenshot.png",
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
