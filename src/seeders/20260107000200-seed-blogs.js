"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "blogs",
      [
        {
          poster:
            "https://firebasestorage.googleapis.com/v0/b/huong-sen-restaurant.appspot.com/o/images%2Fhinh-bai-tin-bhx-6_202409102016042627.jpg?alt=media&token=9a0be40b-4b34-4a3c-be49-1a3c4b053532",
          title: "Khai trương nhà hàng hải sản cao cấp",
          content:
            "Nhà hàng hải sản cao cấp chính thức khai trương với thực đơn đa dạng từ tôm hùm, cua hoàng đế đến các món đặc sản biển tươi sống.",
          author: "Admin",
          blog_category_id: 1,
          slug: "khai-truong-nha-hang-hai-san-cao-cap",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          poster:
            "https://firebasestorage.googleapis.com/v0/b/huong-sen-restaurant.appspot.com/o/images%2Fimage-1_202408241321219624.jpg?alt=media&token=4ca71fa2-9012-43f2-a68f-a26031e01657",
          title: "Top 5 món ăn bán chạy nhất tại nhà hàng",
          content:
            "Danh sách 5 món ăn được thực khách yêu thích nhất bao gồm bò bít tết, lẩu hải sản, gà nướng mật ong, salad cá hồi và súp hải sản.",
          author: "Admin",
          blog_category_id: 2,
          slug: "top-5-mon-an-ban-chay-nhat",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          poster:
            "https://firebasestorage.googleapis.com/v0/b/huong-sen-restaurant.appspot.com/o/images%2F1_202411151005571351.jpg?alt=media&token=3ce62239-fa2c-4fbc-97a0-7a8301547dc9",
          title: "Ưu đãi giảm giá 20% cho khách hàng thân thiết",
          content:
            "Nhà hàng triển khai chương trình giảm giá 20% cho khách hàng thân thiết khi đặt bàn online trong tháng này.",
          author: "Marketing",
          blog_category_id: 3,
          slug: "uu-dai-giam-gia-20-phan-tram",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          poster:
            "https://firebasestorage.googleapis.com/v0/b/huong-sen-restaurant.appspot.com/o/images%2Fimage-9_202409111502118234.jpg?alt=media&token=b0710f6b-f392-46c9-a022-7c32c6e3c526",
          title: "Văn hóa ẩm thực Việt trong không gian hiện đại",
          content:
            "Ẩm thực Việt Nam không chỉ là món ăn mà còn là câu chuyện văn hóa, được nhà hàng tái hiện trong không gian hiện đại và tinh tế.",
          author: "Editor",
          blog_category_id: 4,
          slug: "van-hoa-am-thuc-viet-hien-dai",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("blogs", null, {});
  },
};
