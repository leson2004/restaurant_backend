import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
const configViewEngine = (app) => {
  // Sử dụng body-parser
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cors());

  app.use(express.static("./src/public"));
};
export default configViewEngine;
