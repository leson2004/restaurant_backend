const express = require("express");
const router = express.Router();

import auth from "./auth.route";
import authAdmin from "./auth_admin.route";
import blogCategory from "./blog_category.route";

//private routes
router.use("/category-blog", blogCategory);

//public routes

//normal routes
router.use("/auth", auth);
router.use("/auth_admin", authAdmin);
module.exports = router;
