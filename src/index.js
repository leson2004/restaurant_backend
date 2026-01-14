import express from "express";
import bodyParser from "body-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import initWebRoutes from "./routes/index";
import viewEngine from "./config/viewEngine";
import connectDB from "./config/connectDB";
import chatSocket from "./sockets/chat.socket";
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
server.listen(port, () => {
  console.log(`the port run in ${port} `);
});
