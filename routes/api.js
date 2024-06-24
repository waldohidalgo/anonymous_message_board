"use strict";
const routerThreads = require("../controllers/thread.controller.js");
const routerReplies = require("../controllers/reply.controller.js");
const express = require("express");
const router = express.Router();
module.exports = function (app) {
  app.use("/", routerThreads(router));

  app.use("/", routerReplies(router));
};
