"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("users", [
      {
        fullname: "Admin Nhà Hàng",
        username: "admin",
        email: "admin@restaurant.com",
        tel: "0909000001",
        address: "Hà Nội",
        password: "$2b$10$0ZK9D0lZ9s9zP0FJ6E6P8eK5xQqLqj8Z9Z4lJ0Xnq6GZK3yZ0W", // 123456
        role_id: 1,
        user_type: "Nhân Viên",
        salary: 20000000,
        status: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        fullname: "Nhân Viên A",
        username: "staff01",
        email: "staff01@restaurant.com",
        tel: "0909000002",
        address: "TP.HCM",
        password: "$2b$10$0ZK9D0lZ9s9zP0FJ6E6P8eK5xQqLqj8Z9Z4lJ0Xnq6GZK3yZ0W",
        role_id: 11, // khớp với role "Nhân Viên" trong seed-roles
        user_type: "Nhân Viên",
        salary: 12000000,
        status: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        fullname: "Nguyễn Văn Khách",
        username: "customer01",
        email: "customer01@gmail.com",
        tel: "0909000003",
        address: "Đà Nẵng",
        password: "$2b$10$0ZK9D0lZ9s9zP0FJ6E6P8eK5xQqLqj8Z9Z4lJ0Xnq6GZK3yZ0W",
        role_id: 3,
        user_type: "Khách Hàng",
        status: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", null, {});
  },
};
