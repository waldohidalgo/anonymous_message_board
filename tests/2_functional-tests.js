const chai = require("chai");
const chaiHttp = require("chai-http");
const assert = chai.assert;
const server = require("../server.js");

chai.use(chaiHttp);
suite("Functional Tests", function () {
  let id = null;
  // Creating a new thread: POST request to /api/threads/{board}
  test("Creating a new thread: POST request to /api/threads/{board}", function (done) {
    chai
      .request(server)
      .keepOpen()
      .post("/api/threads/test")
      .send({
        text: "This is a new thread",
        delete_password: "1234",
      })
      .end(function (err, res) {
        id = res.body.id;
        assert.equal(res.status, 200);
        assert.equal(res.body.text, "This is a new thread");
        done();
      });
  });

  // Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}
  test("Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}", function (done) {
    chai
      .request(server)
      .keepOpen()
      .get("/api/threads/test")
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isAtMost(res.body.length, 10);
        assert.isAtMost(res.body[0].replies.length, 3);
        done();
      });
  });

  // Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password

  test("Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password", function (done) {
    chai
      .request(server)
      .keepOpen()
      .delete("/api/threads/test")
      .send({
        thread_id: id,
        delete_password: "incorrect_password",
      })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, "incorrect password");
        done();
      });
  });

  // Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password

  test("Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password", function (done) {
    chai
      .request(server)
      .keepOpen()
      .delete("/api/threads/test")
      .send({
        thread_id: id,
        delete_password: "1234",
      })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, "success");
        done();
      });
  });

  // Reporting a thread: PUT request to /api/threads/{board}

  test("Reporting a thread: PUT request to /api/threads/{board}", function (done) {
    chai
      .request(server)
      .keepOpen()
      .put("/api/threads/test")
      .send({
        thread_id: id,
      })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, "reported");
        done();
      });
  });

  // Creating a new reply: POST request to /api/replies/{board}

  test("Creating a new reply: POST request to /api/replies/{board}", function (done) {
    chai
      .request(server)
      .keepOpen()
      .post("/api/threads/test")
      .send({
        text: "This is a new thread",
        delete_password: "1234",
      })
      .end(function (err, res) {
        id = res.body.id;
        assert.equal(res.status, 200);
        assert.equal(res.body.text, "This is a new thread");

        // crear una nueva respuesta
        chai
          .request(server)
          .keepOpen()
          .post("/api/replies/test")
          .send({
            thread_id: id,
            text: "This is a new reply",
            delete_password: "1234",
          })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
  });

  // Viewing a single thread with all replies: GET request to /api/replies/{board}

  test("Viewing a single thread with all replies: GET request to /api/replies/{board}", function (done) {
    chai
      .request(server)
      .keepOpen()
      .get("/api/replies/test?thread_id=" + id)
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body._id, id);
        assert.equal(res.body.board, "test");
        // verificar si replies es un arreglo
        assert.isArray(res.body.replies);
        // verificar que el campo reported sea undefined
        assert.isUndefined(res.body.reported, undefined);
        // verificar que el campo delete_password sea undefined
        assert.isUndefined(res.body.delete_password, undefined);

        done();
      });
  });
  // Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password

  test("Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password", function (done) {
    chai
      .request(server)
      .keepOpen()
      .delete("/api/replies/test")
      .send({
        thread_id: id,
        reply_id: id,
        delete_password: "incorrect_password",
      })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, "incorrect password");
        done();
      });
  });

  //Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password
  let id_reply = null;
  test("Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password", function (done) {
    // crear una nueva reply
    chai
      .request(server)
      .keepOpen()
      .post("/api/replies/test")
      .send({
        thread_id: id,
        text: "This is a new reply",
        delete_password: "1234",
      })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, "success");

        // obtener la id de la respuesta
        chai
          .request(server)
          .keepOpen()
          .get("/api/replies/test?thread_id=" + id)
          .end(function (err, res) {
            //obtener el id de la respuesta en el primer elemento del array replies
            id_reply = res.body.replies[0]._id;
            chai
              .request(server)
              .keepOpen()
              .delete("/api/replies/test")
              .send({
                thread_id: id,
                reply_id: id_reply,
                delete_password: "1234",
              })
              .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.equal(res.text, "success");
                done();
              });
          });
      });
  });

  // Reporting a reply: PUT request to /api/replies/{board}
  test("Reporting a reply: PUT request to /api/replies/{board}", function (done) {
    // crear una nueva reply
    chai
      .request(server)
      .keepOpen()
      .post("/api/replies/test")
      .send({
        thread_id: id,
        text: "This is a new reply",
        delete_password: "1234",
      })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, "success");

        // obtener la id de la respuesta
        chai
          .request(server)
          .keepOpen()
          .get("/api/replies/test?thread_id=" + id)
          .end(function (err, res) {
            //obtener el id de la respuesta en el primer elemento del array replies
            id_reply = res.body.replies[0]._id;
            //reportar la reply creada
            chai
              .request(server)
              .keepOpen()
              .put("/api/replies/test")
              .send({
                thread_id: id,
                reply_id: id_reply,
              })
              .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.equal(res.text, "reported");
                done();
              });
          });
      });
  });
});
