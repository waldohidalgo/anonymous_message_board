"use strict";
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/db.js");
const apiRoutes = require("./routes/api.js");
const fccTestingRoutes = require("./routes/fcctesting.js");
const runner = require("./test-runner");

const app = express();
app.use(
  helmet({
    xFrameOptions: { action: "sameorigin" },
    xDnsPrefetchControl: { allow: false },
    referrerPolicy: { policy: "same-origin" },
  })
);

app.use("/public", express.static(process.cwd() + "/public"));

app.use(cors({ origin: "*" })); //For FCC testing purposes only

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function start() {
  try {
    await connectDB.connect();

    //Sample front-end
    app.route("/b/:board/").get(function (req, res) {
      res.sendFile(process.cwd() + "/views/board.html");
    });
    app.route("/b/:board/:threadid").get(function (req, res) {
      res.sendFile(process.cwd() + "/views/thread.html");
    });

    //Index page (static HTML)
    app.route("/").get(function (req, res) {
      res.sendFile(process.cwd() + "/views/index.html");
    });

    //For FCC testing purposes
    fccTestingRoutes(app);

    //Routing for API
    apiRoutes(app);

    //404 Not Found Middleware
    app.use(function (req, res, next) {
      res.status(404).type("text").send("Not Found");
    });

    //Start our server and tests!
    const listener = app.listen(process.env.PORT || 3000, function () {
      console.log("Your app is listening on port " + listener.address().port);
      if (process.env.NODE_ENV === "test") {
        console.log("Running Tests...");
        setTimeout(function () {
          try {
            runner.run();
          } catch (e) {
            console.log("Tests are not valid:");
            console.error(e);
          }
        }, 1500);
      }
    });
  } catch (error) {
    console.log("Error: error al conectar a la base de datos" + error.message);
  }
}

start();

module.exports = app; //for testing
