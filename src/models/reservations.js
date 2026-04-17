"use strict";
module.exports = (sequelize, DataTypes) => {
  const Reservation = sequelize.define(
    "Reservation",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      reservation_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },

      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      table_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      promotion_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      fullname: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      tel: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },

      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      party_size: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      start_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      end_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      hold_expired_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      reservation_type: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
        comment: "0=ONLINE,1=WALK_IN",
      },

      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      deposit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      paid_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      payment_method: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
        comment:
          "0=HOLD,1=CONFIRMED,2=CHECKED_IN,3=COMPLETED,4=CANCELED,5=EXPIRED",
      },

      checked_in_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      cancelled_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      refund_type: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: "FULL|HALF|NONE",
      },
      refund_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
      },
      refund_status: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: "PENDING",
      },
      table_changed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      momo_order_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "reservations",
      underscored: true,
      timestamps: true,
    },
  );

  Reservation.associate = (models) => {
    Reservation.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });

    Reservation.belongsTo(models.Table, {
      foreignKey: "table_id",
      as: "table",
    });
    Reservation.belongsTo(models.Promotion, {
      foreignKey: "promotion_id",
      as: "promotion",
    });

    // A reservation can have many reservation details (pre-ordered items)
    Reservation.hasMany(models.ReservationDetail, {
      foreignKey: "reservation_id",
      as: "reservation_details",
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  };

  return Reservation;
};
