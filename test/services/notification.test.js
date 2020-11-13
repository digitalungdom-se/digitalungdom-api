const supertest = require("supertest");

const Profile = require("../profile");

const request = supertest("http://localhost:8080");

describe("NOTIFICATION", function () {
  describe("GET /notification", function () {
    it("should return 200", async () => {
      const p = new Profile(request);
      const u = await Promise.all([p.createUser(), p.createUser()]);

      const a = await u[0].createPost();
      const c = await a.comment(u[1]);
      const cc = await c.comment(u[1]);
      const ccc = await cc.comment(u[1]);
      await ccc.comment(u[0]);

      let response = await u[0].get("/notification", { skip: 0, limit: 10 });
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(3);
      expect(response.body[0].type).toBe("COMMENT_ON_POST");
      expect(response.body[0]._id).toBeDefined();
      expect(response.body[0].at).toBeDefined();
      expect(response.body[0].read).toBe(false);
      expect(response.body[0].data.post).toBeDefined();
      expect(response.body[1].type).toBe("COMMENT_ON_POST");
      expect(response.body[1]._id).toBeDefined();
      expect(response.body[1].at).toBeDefined();
      expect(response.body[1].read).toBe(false);
      expect(response.body[1].data.post).toBeDefined();

      const middleID = response.body[1]._id;

      response = await u[1].get("/notification", { skip: 0, limit: 10 });
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].type).toBe("COMMENT_ON_COMMENT");
      expect(response.body[0]._id).toBeDefined();
      expect(response.body[0].at).toBeDefined();
      expect(response.body[0].read).toBe(false);
      expect(response.body[0].data.post).toBeDefined();
      expect(response.body[0].data.comment).toBeDefined();

      response = await u[0].get("/notification", { skip: 1, limit: 1 });
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0]._id).toBe(middleID);
    });
  });

  describe("PUT /notification", function () {
    it("should return 204", async () => {
      const p = new Profile(request);
      const u = await Promise.all([p.createUser(), p.createUser()]);

      const a = await u[0].createPost();
      await Promise.all([a.comment(u[1]), a.comment(u[1]), a.comment(u[1])]);

      let notifications = (await u[0].get("/notification", { skip: 0, limit: 10 })).body;

      let response = await u[0].put("/notification", { notificationsIDs: [notifications[1]._id] });
      expect(response.status).toBe(204);

      notifications = (await u[0].get("/notification", { skip: 0, limit: 10 })).body;

      expect(notifications[0].read).toBe(false);
      expect(notifications[1].read).toBe(true);
      expect(notifications[2].read).toBe(false);

      response = await u[0].put("/notification", {});
      expect(response.status).toBe(204);

      notifications = (await u[0].get("/notification", { skip: 0, limit: 10 })).body;
      expect(notifications[0].read).toBe(true);
      expect(notifications[1].read).toBe(true);
      expect(notifications[2].read).toBe(true);
    });

    it("should return 204 for reading all", async () => {
      const p = new Profile(request);
      const u = await Promise.all([p.createUser(), p.createUser()]);

      const a = await u[0].createPost();
      await Promise.all([a.comment(u[1]), a.comment(u[1]), a.comment(u[1])]);

      const response = await u[0].put("/notification", {});
      expect(response.status).toBe(204);

      const notifications = (await u[0].get("/notification", { skip: 0, limit: 10 })).body;

      expect(notifications[0].read).toBe(true);
      expect(notifications[1].read).toBe(true);
      expect(notifications[2].read).toBe(true);
    });
  });

  describe("DELETE /notification", function () {
    it("should return 204", async () => {
      const p = new Profile(request);
      const u = await Promise.all([p.createUser(), p.createUser()]);

      const a = await u[0].createPost();
      await Promise.all([a.comment(u[1]), a.comment(u[1]), a.comment(u[1])]);

      const notifications = (await u[0].get("/notification", { skip: 0, limit: 10 })).body;

      const response = await u[0].delete("/notification", { notificationsIDs: [notifications[1]._id] });
      expect(response.status).toBe(204);

      const notificationsNew = (await u[0].get("/notification", { skip: 0, limit: 10 })).body;
      expect(notificationsNew.length).toBe(2);
      expect(notificationsNew[0]._id).toBe(notifications[0]._id);
      expect(notificationsNew[1]._id).toBe(notifications[2]._id);
    });

    it("should return 204 for only read", async () => {
      const p = new Profile(request);
      const u = await Promise.all([p.createUser(), p.createUser()]);

      const a = await u[0].createPost();
      await Promise.all([a.comment(u[1]), a.comment(u[1]), a.comment(u[1])]);

      const notifications = (await u[0].get("/notification", { skip: 0, limit: 10 })).body;

      await u[0].put("/notification", { notificationsIDs: [notifications[0]._id, notifications[2]._id] });

      const response = await u[0].delete("/notification", { onlyRead: true });
      expect(response.status).toBe(204);

      const notificationsNew = (await u[0].get("/notification", { skip: 0, limit: 10 })).body;
      expect(notificationsNew.length).toBe(1);
      expect(notificationsNew[0]._id).toBe(notifications[1]._id);
    });

    it("should return 204 for all", async () => {
      const p = new Profile(request);
      const u = await Promise.all([p.createUser(), p.createUser()]);

      const a = await u[0].createPost();
      await Promise.all([a.comment(u[1]), a.comment(u[1]), a.comment(u[1])]);

      const response = await u[0].delete("/notification", {});
      expect(response.status).toBe(204);

      const notifications = (await u[0].get("/notification", { skip: 0, limit: 10 })).body;
      expect(notifications.length).toBe(0);
    });
  });
});
