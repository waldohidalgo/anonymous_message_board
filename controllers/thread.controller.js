const dotenv = require("dotenv");
dotenv.config();
const { ObjectId } = require("mongodb");
const dbObject = require("../config/db.js");

const pathThreads = "/api/threads/:board";

module.exports = function (router) {
  const threadsCollection = dbObject.db.collection("threads");

  router.get(pathThreads, async (req, res) => {
    const { board } = req.params;
    try {
      const threadsCursor = threadsCollection.aggregate([
        { $match: { board: board } },
        {
          $sort: {
            bumped_on: -1,
          },
        },
        {
          $limit: 10,
        },
        {
          $project: {
            _id: 1,
            board: 1,
            text: 1,
            created_on: 1,
            bumped_on: 1,
            replies: {
              $map: {
                input: {
                  $slice: [
                    {
                      $sortArray: {
                        input: "$replies",
                        sortBy: {
                          created_on: -1,
                        },
                      },
                    },
                    3,
                  ],
                },
                as: "reply",
                in: {
                  _id: "$$reply._id",
                  text: "$$reply.text",
                  created_on: "$$reply.created_on",
                },
              },
            },
          },
        },
      ]);
      const threads = await threadsCursor.toArray();

      res.json(threads);
    } catch (error) {
      console.log(error);
      res.send("error");
    }
  });

  router.post(pathThreads, async (req, res) => {
    const { board } = req.params;
    const { text, delete_password } = req.body;
    const dateNow = new Date();
    const documentoThread = {
      text,
      created_on: dateNow,
      bumped_on: dateNow,
      reported: false,
      delete_password,
      replies: [],
    };

    try {
      const newThread = await threadsCollection.findOneAndUpdate(
        { board, text },
        { $setOnInsert: documentoThread },
        { upsert: true, returnDocument: "after" }
      );

      res.json({ id: newThread._id, text: newThread.text });
    } catch (error) {
      console.log(error);
      res.send("error");
    }
  });

  router.delete(pathThreads, async (req, res) => {
    const { thread_id, delete_password } = req.body;
    try {
      const threadDocumentDeleted = await threadsCollection.findOneAndDelete({
        _id: new ObjectId(String(thread_id)),
        delete_password,
      });

      if (threadDocumentDeleted) {
        res.send("success");
      } else {
        res.send("incorrect password");
      }
    } catch (error) {
      if (
        error.message ===
        "input must be a 24 character hex string, 12 byte Uint8Array, or an integer"
      ) {
        res.send("invalid id");
        return;
      }
      console.log(error);
      res.send("error");
    }
  });

  router.put(pathThreads, async (req, res) => {
    const { report_id, thread_id } = req.body;
    const idThread = report_id || thread_id;

    //The reported value of the thread_id will be changed to true.

    try {
      const updatedDocument = await threadsCollection.findOneAndUpdate(
        { _id: new ObjectId(String(idThread)), reported: false },
        { $set: { reported: true } },
        { returnDocument: "after" }
      );
      res.send("reported");
    } catch (error) {
      if (
        error.message ===
        "input must be a 24 character hex string, 12 byte Uint8Array, or an integer"
      ) {
        res.send("invalid id");
        return;
      }
      console.log(error.message);
      res.send("error");
    }
  });
  return router;
};
