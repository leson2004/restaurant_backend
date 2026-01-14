const chatService = require("../services/chat.service");
const GeminiService = require("../services/gemini.service");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(" Client connected:", socket.id);

    // Join room
    socket.on("join-room", ({ roomId }) => {
      if (!roomId) return;
      socket.join(`room_${roomId}`);
    });

    // Gửi tin nhắn
    socket.on("send-message", async (data) => {
      try {
        const { roomId, senderRole, senderId, message, toBot } = data;

        // Validate cơ bản (socket level)
        if (!roomId || !senderRole || !message) {
          return;
        }

        // 1️⃣ Lưu tin nhắn user/admin
        const savedMessage = await chatService.createMessage({
          roomId,
          senderRole,
          senderId,
          message,
        });

        // 2️⃣ Emit realtime
        io.to(`room_${roomId}`).emit("receive-message", {
          id: savedMessage.id,
          roomId,
          senderRole,
          senderId,
          message,
          created_at: savedMessage.created_at,
        });

        // 3️⃣ Nếu customer hỏi bot
        if (senderRole === "customer" && toBot) {
          const botReply = await GeminiService.chatWithCustomer(message);

          const botMessage = await chatService.createMessage({
            roomId,
            senderRole: "bot",
            senderId: null,
            message: botReply,
          });

          io.to(`room_${roomId}`).emit("receive-message", {
            id: botMessage.id,
            roomId,
            senderRole: "bot",
            senderId: null,
            message: botReply,
            created_at: botMessage.created_at,
          });
        }
      } catch (error) {
        console.error(" Socket send-message error:", error.message);

        socket.emit("error-message", {
          message: "Không gửi được tin nhắn",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(" Client disconnected:", socket.id);
    });
  });
};
