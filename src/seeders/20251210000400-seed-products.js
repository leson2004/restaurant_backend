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
      {
        product_code: "PC1003",
        name: "Cơm hến Huế",
        price: 35000,
        sale_price: 32000,
        image:
          "https://firebasestorage.googleapis.com/v0/b/huong-sen-restaurant.appspot.com/o/images%2Fcom-hen.jpg",
        description: "Cơm hến đậm đà hương vị Huế",
        status: 1,
        categories_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        product_code: "PC1004",
        name: "Bánh bèo chén",
        price: 28000,
        sale_price: 25000,
        image:
          "https://firebasestorage.googleapis.com/v0/b/huong-sen-restaurant.appspot.com/o/images%2Fbanh-beo.jpg",
        description: "Bánh bèo chén nhân tôm chấy, mỡ hành",
        status: 1,
        categories_id: 2,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        product_code: "PC1005",
        name: "Chè hạt sen long nhãn",
        price: 25000,
        sale_price: 22000,
        image:
          "https://firebasestorage.googleapis.com/v0/b/huong-sen-restaurant.appspot.com/o/images%2Fche-hat-sen.jpg",
        description: "Món chè thanh mát, tốt cho sức khỏe",
        status: 1,
        categories_id: 4, // Tráng miệng
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        product_code: "PC1006",
        name: "Trà sen Huế",
        price: 20000,
        sale_price: 18000,
        image:
          "https://firebasestorage.googleapis.com/v0/b/huong-sen-restaurant.appspot.com/o/images%2Ftra-sen.jpg",
        description: "Trà sen Huế thơm nhẹ, uống nóng hoặc đá",
        status: 1,
        categories_id: 3, // Đồ uống
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        product_code: "PC1007",
        name: "Lẩu bò Huế",
        price: 220000,
        sale_price: 199000,
        image:
          "https://firebasestorage.googleapis.com/v0/b/huong-sen-restaurant.appspot.com/o/images%2Flau-bo-hue.jpg",
        description: "Lẩu bò Huế cay nồng cho nhóm 3-4 người",
        status: 1,
        categories_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        product_code: "PC1008",
        name: "Set gia đình 4 người",
        price: 450000,
        sale_price: 420000,
        image:
          "https://firebasestorage.googleapis.com/v0/b/huong-sen-restaurant.appspot.com/o/images%2Fcombo-gia-dinh.jpg",
        description: "Combo món chính, khai vị, tráng miệng cho 4 người",
        status: 1,
        categories_id: 5, // Combo gia đình
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        product_code: "PC1009",
        name: "Ba chỉ heo nướng mật ong",
        price: 120000,
        sale_price: 110000,
        image:
          "https://firebasestorage.googleapis.com/v0/b/huong-sen-restaurant.appspot.com/o/images%2Fdo-nuong.jpg",
        description: "Ba chỉ heo nướng than hoa sốt mật ong",
        status: 1,
        categories_id: 6, // Đồ nướng
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("products", null, {});
  },
};
