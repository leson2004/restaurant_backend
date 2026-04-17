const chatService = require("../services/chat.service");

// Customer mở / lấy phòng chat
const getOrCreateRoom = async (req, res) => {
  try {
    const { customerId } = req.body;

    // VALIDATE
    if (!customerId) {
      return res.status(400).json({
        message: "customerId là bắt buộc",
      });
    }

    const room = await chatService.getOrCreateRoom(customerId);

    return res.status(200).json({
      message: "Lấy phòng chat thành công",
      data: room,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// Gửi tin nhắn
const createMessage = async (req, res) => {
  try {
    const { roomId, senderRole, senderId, message } = req.body;

    // VALIDATE
    if (!roomId || !senderRole || !message) {
      return res.status(400).json({
        message: "Thiếu dữ liệu bắt buộc",
      });
    }

    const msg = await chatService.createMessage({
      roomId,
      senderRole,
      senderId,
      message,
    });

    return res.status(201).json({
      message: "Gửi tin nhắn thành công",
      data: msg,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gửi tin nhắn thất bại",
      error: error.message,
    });
  }
};

// Customer xem lịch sử chat
const getMessagesByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        message: "userId là bắt buộc",
      });
    }

    const messages = await chatService.getMessagesByUser(userId);

    return res.status(200).json({
      message: "Lấy tin nhắn thành công",
      data: messages,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// Admin xem danh sách phòng chat
const getAdminRooms = async (req, res) => {
  try {
    const rooms = await chatService.getAdminRooms();

    return res.status(200).json({
      message: "Lấy danh sách phòng chat thành công",
      data: rooms,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};
const getMessagesByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "roomId is required",
      });
    }

    const messages = await chatService.getMessagesByRoomId(roomId);

    return res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("getMessagesByRoom error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
module.exports = {
  getOrCreateRoom,
  getMessagesByUser,
  createMessage,
  getAdminRooms,
  getMessagesByRoom,
};
