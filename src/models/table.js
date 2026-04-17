"use strict";
module.exports = (sequelize, DataTypes) => {
  const Table = sequelize.define(
    "Table",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },

      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: "tables",
      underscored: true,
      timestamps: true,
    },
  );

  Table.associate = (models) => {
    Table.hasMany(models.Reservation, {
      foreignKey: "table_id",
      as: "reservations",
    });
  };

  return Table;
};
