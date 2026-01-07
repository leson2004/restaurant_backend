const express = require("express");
const router = express.Router();

import auth from "./auth.route";
import authAdmin from "./auth_admin.route";
import blogCategory from "./blog_category.route";
import authenticateToken from "../middlewares/auth.middleware";
//private routes
router.use("/category-blog", blogCategory);

//public routes

//normal routes
router.use("/auth", auth);
router.use("/auth_admin", authAdmin);

// Privated Routes
router.use("/customer", CustomerApi);
router.use("/employee", authenticateToken, employeesApi);
router.use("/blogs", authenticateToken, blogsApi);
router.use("/reservations", authenticateToken, reservationsApi);
router.use("/category-product", authenticateToken, productCategoriessApi);
router.use("/product", authenticateToken, productsApi);
router.use("/permissions", authenticateToken, permissionsApi);
router.use("/role", authenticateToken, rolesApi);
router.use("/roles_permissions", authenticateToken, role_permissionsApi);
router.use("/category-blog", authenticateToken, categoryBlogsApi);
router.use("/promotions", authenticateToken, promotionsApi);
router.use("/tables", authenticateToken, tablesBlogsApi);
router.use("/comment-blog", authenticateToken, commentBlogApi);
router.use("/reservations_t_admin", authenticateToken, reservations_t_admin);
router.use("/statistical", authenticateToken, statistical);
router.use("/email", authenticateToken, sendEmail);

// Public Routes
router.use("/public/category-product", productCategoriessApi);
router.use("/public/product", productsApi);
router.use("/public/blogs", blogsApi);
router.use("/public/promotion", promotionsApi);
router.use("/public/reservations", reservationsApi);
router.use("/public/reservation_detail", reservation_detail);
router.use("/public/payment", paymentApi);
router.use("/public/reservation_detail", reservation_detail);
router.use("/public/table", tablesBlogsApi);
router.use("/public/comment-blog", commentBlogApi);
router.use("/public/membership", membershipApi);
router.use("/public/membership_tiers", membershipTiersApi);

// Normal Routes
router.use("/chatbot", chatbotApi);
router.use("/auth", AuthApi);
router.use("/auth_admin", autAdminApi);
router.use("/users", usersAPI);
router.use("/contact", contactApi);
module.exports = router;
