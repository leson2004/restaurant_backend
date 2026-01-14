const { ChatRoom, ChatMessage, User, sequelize } = require("../models/index");

// Lấy hoặc tạo phòng chat cho customer
const getOrCreateRoom = async (customerId) => {
  const room = await ChatRoom.findOne({
    where: { customer_id: customerId },
  });

  if (room) return room;

  return ChatRoom.create({ customer_id: customerId });
};

// Tạo tin nhắn (CÓ TRANSACTION)
const createMessage = async ({ roomId, senderRole, senderId, message }) => {
  const transaction = await sequelize.transaction();

  try {
    const msg = await ChatMessage.create(
      {
        room_id: roomId,
        sender_role: senderRole,
        sender_id: senderId,
        message,
      },
      { transaction }
    );

    await ChatRoom.update(
      {
        last_message: message,
        last_message_at: new Date(),
      },
      {
        where: { id: roomId },
        transaction,
      }
    );

    await transaction.commit();
    return msg;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Lấy tin nhắn theo user (customer)
const getMessagesByUser = async (userId) => {
  const room = await ChatRoom.findOne({
    where: { customer_id: userId },
  });

  if (!room) return [];

  return ChatMessage.findAll({
    where: { room_id: room.id },
    order: [["created_at", "ASC"]],
  });
};

// Admin lấy danh sách phòng chat
const getAdminRooms = async () => {
  return ChatRoom.findAll({
    include: [
      {
        model: User,
        as: "customer",
        attributes: ["id", "fullname", "tel", "avatar"],
      },
    ],
    order: [["last_message_at", "DESC"]],
  });
};

module.exports = {
  getOrCreateRoom,
  getMessagesByUser,
  createMessage,
  getAdminRooms,
};
