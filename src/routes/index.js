const express = require("express");
const router = express.Router();

const authRoute = require("./auth.route");
const authAdminRoute = require("./auth_admin.route");
const blogCategoryRoute = require("./blog_category.route");
const productCategoryRoute = require("./product_catgories.route");
const productRoute = require("./products.route");
const blogRoute = require("./blogs.route");
const commentBlogRoute = require("./comment_blogs.route");
const userRoute = require("./users.route");
// const contactRoute = require("./contact.route");
const customerRoute = require("./customers.route");
const employeeRoute = require("./employees.route");
const membershipTierRoute = require("./membership_tiers.route");
const membershipRoute = require("./membership.route");
const paymentRoute = require("./payment.route");
const permissionRoute = require("./permissions.route");
const promotionRoute = require("./promotions.route");
const reservationAdminRoute = require("./reservation_admin.route");
const reservationRoute = require("./reservation.route");
const reservationDetailRoute = require("./reservation_detail.route");
const rolePermissionRoleRoute = require("./roles_permissions.route");
const roleRoute = require("./roles.route");
const tableRoute = require("./tables.route");
const authenticateToken = require("../middlewares/auth.middleware");

//public routes

//normal routes

// Privated Routes
router.use("/customer", customerRoute);
router.use("/employee", authenticateToken, employeeRoute);
router.use("/blogs", authenticateToken, blogRoute);
router.use("/reservations", authenticateToken, reservationRoute);
router.use("/category-product", authenticateToken, productCategoryRoute);
router.use("/product", authenticateToken, productRoute);
router.use("/permissions", authenticateToken, permissionRoute);
router.use("/role", authenticateToken, roleRoute);
router.use("/roles_permissions", authenticateToken, rolePermissionRoleRoute);
router.use("/category-blog", authenticateToken, blogCategoryRoute);
router.use("/promotions", authenticateToken, promotionRoute);
router.use("/tables", authenticateToken, tableRoute);
router.use("/comment-blog", authenticateToken, commentBlogRoute);
router.use("/reservations_t_admin", authenticateToken, reservationAdminRoute);
// router.use("/statistical", authenticateToken, statistical);
// router.use("/email", authenticateToken, sendEmail);

// Public Routes
router.use("/public/category-product", productCategoryRoute);
router.use("/public/product", productRoute);
router.use("/public/blogs", blogRoute);
router.use("/public/promotion", promotionRoute);
router.use("/public/reservations", reservationRoute);
router.use("/public/reservation_detail", reservationDetailRoute);
router.use("/public/payment", paymentRoute);
router.use("/public/reservation_detail", reservationDetailRoute);
router.use("/public/table", tableRoute);
router.use("/public/comment-blog", commentBlogRoute);
router.use("/public/membership", membershipRoute);
router.use("/public/membership_tiers", membershipTierRoute);

// Normal Routes
// router.use("/chatbot", chatbotApi);
router.use("/auth", authRoute);
router.use("/auth_admin", authAdminRoute);
router.use("/users", userRoute);
// router.use("/contact", contactApi);
module.exports = router;
