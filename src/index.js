import express from "express";
import bodyParser from "body-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import initWebRoutes from "./routes/index";
import viewEngine from "./config/viewEngine";
import connectDB from "./config/connectDB";
import chatSocket from "./sockets/chat.socket";
import startReservationExpiryJob from "./jobs/reservationExpiry.job";
require("dotenv").config();

const app = express();
const server = createServer(app);
const io = new Server(server);
//config app
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;
viewEngine(app);
connectDB();
app.use("/api", initWebRoutes);
chatSocket(io);

// Start scheduled jobs
startReservationExpiryJob();

server.listen(port, () => {
  console.log(`the port run in ${port} `);
});
