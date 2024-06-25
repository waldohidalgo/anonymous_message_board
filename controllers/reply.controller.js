const dbObject = require("../config/db.js");
const { ObjectId } = require("mongodb");
module.exports = function (router) {
  const threadsCollection = dbObject.db.collection("threads");

  const pathReplies = "/api/replies/:board";
  router.get(pathReplies, async (req, res) => {
    const { board } = req.params;
    const { thread_id } = req.query;

    try {
      // obtener el documento que contiene el thread_id y todas sus replies excluyendo los campos reported y delete_password
      const threadDocument = await threadsCollection.findOne(
        { _id: new ObjectId(String(thread_id)) },
        {
          projection: {
            "replies.reported": 0,
            "replies.delete_password": 0,
            reported: 0,
            delete_password: 0,
          },
        }
      );
      if (threadDocument) {
        threadDocument?.replies.sort(
          (a, b) => new Date(b.created_on) - new Date(a.created_on)
        );

        res.json(threadDocument);
      } else {
        res.send("thread not found");
      }
    } catch (error) {
      console.log(error);
      res.send("error");
    }
  });

  router.post(pathReplies, async (req, res) => {
    const { text, delete_password, thread_id } = req.body;
    const newBumpedOnDate = new Date();

    try {
      const newReply = {
        _id: new ObjectId(),
        text,
        created_on: newBumpedOnDate,
        delete_password,
        reported: false,
      };
      // update the bumped_on date to the replies date and push the new reply
      const result = await threadsCollection.updateOne(
        { _id: new ObjectId(String(thread_id)) },
        { $set: { bumped_on: newBumpedOnDate }, $push: { replies: newReply } }
      );

      if (result.modifiedCount === 1) {
        res.send("success");
        return;
      }

      res.send("error to update the bumped_on date on thread");
    } catch (error) {
      console.log(error);
      res.send("error");
    }
  });

  router.delete(pathReplies, async (req, res) => {
    const { thread_id, reply_id, delete_password } = req.body;

    //Returned will be the string incorrect password or success. On success, the text of the reply_id will be changed to [deleted].

    try {
      const updatedDocument = await threadsCollection.updateOne(
        {
          _id: new ObjectId(String(thread_id)),
        },
        {
          $set: {
            "replies.$[reply].text": "[deleted]",
          },
        },
        {
          arrayFilters: [
            {
              "reply._id": new ObjectId(String(reply_id)),
              "reply.delete_password": delete_password,
            },
          ],
        }
      );

      if (updatedDocument.modifiedCount === 1) {
        res.send("success");
        return;
      } else {
        res.send("incorrect password");
        return;
      }
    } catch (error) {
      console.log(error);
      res.send("error");
    }
  });

  router.put(pathReplies, async (req, res) => {
    const { thread_id, reply_id } = req.body;

    try {
      // The reported value of the reply_id will be changed to true.

      const updatedDocument = await threadsCollection.findOneAndUpdate(
        {
          _id: new ObjectId(String(thread_id)),
          "replies._id": new ObjectId(String(reply_id)),
          "replies.reported": false,
        },
        {
          $set: {
            "replies.$.reported": true,
          },
        },
        {
          returnDocument: "after",
        }
      );

      res.send("reported");
    } catch (error) {
      console.log(error);
      res.send("error");
    }
  });

  return router;
};
