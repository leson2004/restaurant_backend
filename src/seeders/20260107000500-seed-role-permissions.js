"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Lấy tất cả permission hiện có
    const permissions = await queryInterface.sequelize.query(
      "SELECT id FROM permissions",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const rolePermissions = [];

    /**
     * ROLE MAP
     * 1  = Admin
     * 3  = Quản trị sản phẩm
     * 4  = Quản trị danh mục
     * 5  = Tư vấn viên
     * 8  = Chủ nhà hàng (FULL)
     */

    // 🔥 ROLE 8: Chủ nhà hàng → FULL QUYỀN
    for (const p of permissions) {
      rolePermissions.push({
        role_id: 8,
        permission_id: p.id,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    // 🔹 ROLE 1: Admin → gần full (trừ chat nếu muốn)
    for (const p of permissions) {
      rolePermissions.push({
        role_id: 1,
        permission_id: p.id,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    // 🟢 ROLE 3: Quản trị sản phẩm (1–5)
    [1, 2, 3, 4, 5].forEach((pid) => {
      rolePermissions.push({
        role_id: 3,
        permission_id: pid,
        created_at: new Date(),
        updated_at: new Date(),
      });
    });

    // 🟡 ROLE 4: Quản trị danh mục sản phẩm (6–10)
    [6, 7, 8, 9, 10].forEach((pid) => {
      rolePermissions.push({
        role_id: 4,
        permission_id: pid,
        created_at: new Date(),
        updated_at: new Date(),
      });
    });

    // 🔵 ROLE 5: Tư vấn viên (chat + xem)
    // [7, 8, 9, 10, 11, 12, 13, 70].forEach((pid) => {
    //   rolePermissions.push({
    //     role_id: 5,
    //     permission_id: pid,
    //     created_at: new Date(),
    //     updated_at: new Date(),
    //   });
    // });

    await queryInterface.bulkInsert("role_permissions", rolePermissions);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("role_permissions", null, {});
  },
};
