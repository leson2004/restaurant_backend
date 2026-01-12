"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "blog_categories",
      [
        {
          id: 1,
          name: "Tin tức nhà hàng",
          status: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          name: "Món ăn nổi bật",
          status: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 3,
          name: "Khuyến mãi & Ưu đãi",
          status: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 4,
          name: "Văn hóa ẩm thực",
          status: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("blog_categories", null, {});
  },
};
