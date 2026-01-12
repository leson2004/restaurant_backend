const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET_KEY;

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Token không tồn tại hoặc không hợp lệ",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded; // gắn user vào request
    next();
  } catch (error) {
    return res.status(403).json({
      message: "Không có quyền truy cập",
    });
  }
};

module.exports = authenticateToken;
