const supertest = require("supertest");
const moment = require("moment");

const Profile = require("../profile");
const { v4 } = require("uuid");

const request = supertest("http://localhost:8080");

describe("AGORA", function () {
  describe("POST /agoragram", function () {
    it("should return 200", async () => {
      const p = new Profile(request);
      const u = await p.createUser();

      const agoragram = {
        body: "test body",
        title: "Test title",
        tags: ["tag1", "tag2"],
        type: "TEXT",
      };

      const response = await u.post("/agoragram", agoragram);

      expect(response.status).toBe(201);
      expect(response.body._id).toBeDefined();
      expect(response.body.author).toBe(u._id);
      expect(response.body.shortID).toBeDefined();
      expect(response.body.title).toBe(agoragram.title);
      expect(response.body.body).toBe(agoragram.body);
      expect(response.body.modified).toBeUndefined();
      expect(response.body.pinned).toBeUndefined();
      expect(response.body.deleted).toBeUndefined();
      expect(response.body.stars).toBe(0);
      expect(response.body.commentAmount).toBe(0);
      expect(response.body.children.length).toBe(0);
      expect(response.body.type).toBe(agoragram.type);
      expect(response.body.tags).toMatchObject(agoragram.tags);
      expect(response.body.display.type).toBe("USER");
    });
  });

  describe("POST /agoragram/:agoragramID/comment", function () {
    it("should return 200", async () => {
      const p = new Profile(request);
      const u = await p.createUser();
      const a = await u.createPost();

      const agoragram = {
        body: v4() + v4() + v4(),
        replyTo: a._id,
      };

      const response = await u.post(`/agoragram/${a._id}/comment`, agoragram);

      expect(response.status).toBe(201);
      expect(response.body._id).toBeDefined();
      expect(response.body.author).toBe(u._id);
      expect(response.body.shortID).toBeDefined();
      expect(response.body.body).toBe(agoragram.body);
      expect(response.body.modified).toBeUndefined();
      expect(response.body.pinned).toBeUndefined();
      expect(response.body.deleted).toBeUndefined();
      expect(response.body.stars).toBe(0);
      expect(response.body.children.length).toBe(0);
      expect(response.body.type).toBe("COMMENT");
      expect(response.body.display.type).toBe("USER");
      expect(response.body.post._id).toBe(a._id);
      expect(response.body.post.shortID).toBe(a.shortID);
      expect(response.body.replyTo).toBe(a._id);
    });
  });

  describe("GET /agoragram", function () {
    it("should return 200", async () => {
      const p = new Profile(request);
      const u = await p.createUser();
      await Promise.all([u.createPost(), u.createPost(), u.createPost()]);

      const response = await u.get("/agoragram", { sort: "NEW", skip: 0, limit: 10 });
      const agoragram = response.body[0];

      expect(response.status).toBe(200);
      expect(agoragram._id).toBeDefined();
      expect(agoragram.author._id).toBeDefined();
      expect(agoragram.author.details.firstName).toBeDefined();
      expect(agoragram.author.details.lastName).toBeDefined();
      expect(agoragram.shortID).toBeDefined();
      expect(agoragram.title).toBeDefined();
      expect(agoragram.body).toBeDefined();
      expect(agoragram.modified).toBeUndefined();
      expect(agoragram.pinned).toBeUndefined();
      expect(agoragram.deleted).toBeUndefined();
      expect(agoragram.stars).toBeDefined();
      expect(agoragram.commentAmount).toBeDefined();
      expect(agoragram.children.length).toBeDefined();
      expect(agoragram.type).toBeDefined();
      expect(agoragram.tags).toBeDefined();
      expect(agoragram.display.type).toBe("USER");
      expect(agoragram.starred).toBe(false);
    });
  });

  describe("GET /agoragram/:agoragramID", function () {
    it("should return 200", async () => {
      const p = new Profile(request);
      const u = await p.createUser();
      const a = await u.createPost();
      const comments = await Promise.all([a.comment(u), a.comment(u), a.comment(u)]);

      const response = await u.get(`/agoragram/${a._id}`, {});
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1 + comments.length);

      const post = response.body[0];
      const comment = comments[0];
      let returnedComment = response.body[1];
      response.body.forEach(test => {
        if (test._id === comment._id) {
          returnedComment = test;
        }
      });

      expect(post._id).toBe(a._id);
      expect(post.author._id).toBe(u._id);
      expect(post.author.details.firstName).toBe(u.firstName);
      expect(post.author.details.lastName).toBe(u.lastName);
      expect(post.shortID).toBe(a.shortID);
      expect(post.title).toBe(a.title);
      expect(post.body).toBe(a.body);
      expect(post.modified).toBeUndefined();
      expect(post.pinned).toBeUndefined();
      expect(post.deleted).toBeUndefined();
      expect(post.stars).toBe(0);
      expect(post.commentAmount).toBe(comments.length);
      expect(post.children.length).toBe(comments.length);
      expect(post.type).toBe("TEXT");
      expect(post.tags).toMatchObject(a.tags);
      expect(post.display.type).toBe("USER");
      expect(post.starred).toBe(false);

      expect(returnedComment._id).toBe(comment._id);
      expect(returnedComment.author._id).toBe(u._id);
      expect(returnedComment.author.details.firstName).toBe(u.firstName);
      expect(returnedComment.author.details.lastName).toBe(u.lastName);
      expect(returnedComment.shortID).toBe(comment.shortID);
      expect(returnedComment.title).toBeUndefined();
      expect(returnedComment.body).toBe(comment.body);
      expect(returnedComment.modified).toBeUndefined();
      expect(returnedComment.pinned).toBeUndefined();
      expect(returnedComment.deleted).toBeUndefined();
      expect(returnedComment.stars).toBe(0);
      expect(returnedComment.commentAmount).toBeUndefined();
      expect(returnedComment.children.length).toBe(0);
      expect(returnedComment.type).toBe("COMMENT");
      expect(returnedComment.tags).toBeUndefined();
      expect(returnedComment.display.type).toBe("USER");
      expect(returnedComment.starred).toBe(false);
    });
  });

  describe("PUT /agoragram/:agoragramID", function () {
    it("should return 200", async () => {
      const p = new Profile(request);
      const u = await p.createUser();
      const a = await u.createPost();

      const body = v4();
      const response = await u.put(`/agoragram/${a._id}`, { body });

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(a._id);
      expect(response.body.author).toBe(u._id);
      expect(response.body.shortID).toBe(a.shortID);
      expect(response.body.title).toBe(a.title);
      expect(response.body.body).toBe(body);
      expect(moment.utc(response.body.modified).unix()).toBeLessThanOrEqual(moment.utc().unix());
      expect(response.body.pinned).toBeUndefined();
      expect(response.body.deleted).toBeUndefined();
      expect(response.body.stars).toBe(0);
      expect(response.body.commentAmount).toBe(0);
      expect(response.body.children.length).toBe(0);
      expect(response.body.type).toBe("TEXT");
      expect(response.body.tags).toMatchObject(a.tags);
      expect(response.body.display.type).toBe("USER");

      const getAgoragramResp = await u.get(`/agoragram/${a._id}`, {});

      expect(getAgoragramResp.body[0].body).toBe(body);
      expect(moment.utc(getAgoragramResp.body[0].modified).unix()).toBeLessThanOrEqual(moment.utc().unix());
    });
  });

  describe("DELETE /agoragram/:agoragramID", function () {
    it("should return 200", async () => {
      const p = new Profile(request);
      const u = await p.createUser();
      const a = await u.createPost();

      const body = v4();
      const response = await u.delete(`/agoragram/${a._id}`, { body });

      expect(response.status).toBe(204);
      const getAgoragramResp = await u.get(`/agoragram/${a._id}`, {});

      expect(getAgoragramResp.status).toBe(404);
    });
  });

  describe("POST /agoragram/:agoragramID/star", function () {
    it("should return 200", async () => {
      const p = new Profile(request);
      const u = await p.createUser();
      const a = await u.createPost();

      let response = await u.post(`/agoragram/${a._id}/star`, {});
      expect(response.status).toBe(200);
      expect(response.body.action).toBe("STARRED");

      let getAgoragramResp = await u.get(`/agoragram/${a._id}`, {});
      expect(getAgoragramResp.body[0].starred).toBe(true);

      response = await u.post(`/agoragram/${a._id}/star`, {});
      expect(response.body.action).toBe("UNSTARRED");

      getAgoragramResp = await u.get(`/agoragram/${a._id}`, {});
      expect(getAgoragramResp.body[0].starred).toBe(false);
    });

    it("should return 200 on comment", async () => {
      const p = new Profile(request);
      const u = await p.createUser();
      const a = await u.createPost();
      const c = await u.createComment(a);

      let response = await u.post(`/agoragram/${c._id}/star`, {});
      expect(response.status).toBe(200);
      expect(response.body.action).toBe("STARRED");

      let getAgoragramResp = await u.get(`/agoragram/${c._id}`, {});
      expect(getAgoragramResp.body[0].starred).toBe(true);

      response = await u.post(`/agoragram/${c._id}/star`, {});
      expect(response.body.action).toBe("UNSTARRED");

      getAgoragramResp = await u.get(`/agoragram/${c._id}`, {});
      expect(getAgoragramResp.body[0].starred).toBe(false);
    });
  });
});
