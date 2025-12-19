import express from "express";
import bodyParser from "body-parser";
import initWebRoutes from "./routes/index";
import viewEngine from "./config/viewEngine";
import connectDB from "./config/connectDB";
require("dotenv").config();

const app = express();
//config app
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;
viewEngine(app);
connectDB();
app.use("/api", initWebRoutes);
app.listen(port, () => {
  console.log(`the port run in ${port} `);
});
