const supertest = require("supertest");
const { v4 } = require("uuid");
const crypto = require("crypto");

const Profile = require("../profile");

const request = supertest("http://localhost:8080");

describe("User", function () {
  describe("POST /user/register", function () {
    it("should return 201", async () => {
      const email = `${v4()}@${v4()}.com`;
      const firstName = v4();
      const lastName = v4();
      const gender = "MALE";
      const username = crypto
        .randomBytes(16)
        .toString("base64")
        .replace(/[+.=/]/g, "");
      const birthdate = "2001-06-28T00:00:00.000Z";
      const response = await request.post("/user/register").send({ email, firstName, lastName, gender, birthdate, username });

      expect(response.status).toBe(201);
      expect(response.body._id).toBeDefined();
      expect(response.body.details.email.raw).toBe(email);
      expect(response.body.details.firstName).toBe(firstName);
      expect(response.body.details.lastName).toBe(lastName);
      expect(response.body.details.username).toBe(username);
      expect(response.body.details.gender).toBe(gender);
      expect(response.body.details.birthdate).toBe(birthdate);
    });
  });

  describe("POST /user/auth/email/send_code", function () {
    it("should return 201", async () => {
      const p = new Profile(request);
      const u = await p.registerUser();

      const response = await request.post("/user/auth/email/send_code").send({ email: u.email });

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });
  });

  describe("GET /user", function () {
    it("should return 200", async () => {
      const p = new Profile(request);
      const u = await p.createUser();

      let response = await request.get("/user").query({ email: u.email });
      expect(response.status).toBe(200);
      expect(response.body._id).toBe(u._id);

      response = await request.get("/user").query({ _id: u._id });
      expect(response.status).toBe(200);
      expect(response.body._id).toBe(u._id);
    });

    it("should return 404", async () => {
      let response = await request.get("/user").query({ email: `${v4()}@${v4()}.se` });
      expect(response.status).toBe(404);

      response = await request.get("/user").query({ _id: "5f235a709af0b4125e4424c6" });
      expect(response.status).toBe(404);
    });
  });

  describe("GET /user/@me", function () {
    it("should return 200", async () => {
      const p = new Profile(request);
      const u = await p.createUser();

      const response = await u.get("/user/@me", {});

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(u._id);
      expect(response.body.details.email.raw).toBe(u.email);
      expect(response.body.details.firstName).toBe(u.firstName);
      expect(response.body.details.lastName).toBe(u.lastName);
      expect(response.body.details.username).toBe(u.username);
      expect(response.body.details.gender).toBe(u.gender);
      expect(response.body.details.birthdate).toBe(u.birthdate);
    });

    it("should return 404", async () => {
      const response = await request.get("/user/@me");

      expect(response.status).toBe(401);
    });
  });

  describe("PUT /user/@me", function () {
    it("should return 204", async () => {
      const p = new Profile(request);
      const u = await p.createUser();

      const newUser = {
        username: v4().substring(0, 12).replace("-", ""),
        firstName: v4().substring(0, 12),
        lastName: v4().substring(0, 12),
        birthdate: "2000-08-01T00:00:00.000Z",
        gender: "MALE",
        profileColour: "#4287f5",
        profileStatus: v4().substring(0, 12),
        profileBio: v4().substring(0, 12),
        profileURL: "https://digitalungdom.se/",
      };

      const response = await u.put("/user/@me", newUser);
      expect(response.status).toBe(204);

      const getUserResp = await request.get("/user").query({ _id: u._id });
      expect(getUserResp.status).toBe(200);
      expect(getUserResp.body.details.username).toBe(newUser.username);
      expect(getUserResp.body.details.firstName).toBe(newUser.firstName);
      expect(getUserResp.body.details.lastName).toBe(newUser.lastName);
      expect(getUserResp.body.agora.score.posts).toBe(0);
      expect(getUserResp.body.agora.score.comments).toBe(0);
      expect(getUserResp.body.agora.score.stars).toBe(0);
      expect(getUserResp.body.agora.score.posts).toBe(0);
      expect(getUserResp.body.agora.score.followers).toBe(0);
      expect(getUserResp.body.agora.profile.colour).toBe(newUser.profileColour);
      expect(getUserResp.body.agora.profile.status).toBe(newUser.profileStatus);
      expect(getUserResp.body.agora.profile.bio).toBe(newUser.profileBio);
      expect(getUserResp.body.agora.profile.url).toBe(newUser.profileURL);
    });
  });

  describe("DELETE /user/@me", function () {
    it("should return 204", async () => {
      const p = new Profile(request);
      const u = await p.createUser();

      const response = await u.delete("/user/@me", {});

      expect(response.status).toBe(204);

      const getUserResp = await request.get("/user").query({ _id: u._id });
      expect(getUserResp.status).toBe(404);
    });
  });

  describe("POST /user/@me/profile_picture", function () {
    it("should return 201", async () => {
      const p = new Profile(request);
      const u = await p.createUser();

      const response = await request.post("/user/@me/profile_picture").set("Authorization", `Bearer ${u.accessToken}`).attach("profilePicture", "test/assets/robotFaceIcon.png");

      expect(response.status).toBe(201);
    });
  });

  describe("GET /user/:userID/profile_picture", function () {
    it("should return 200", async () => {
      const p = new Profile(request);
      const u = await p.createUser();

      await request.post("/user/@me/profile_picture").set("Authorization", `Bearer ${u.accessToken}`).attach("profilePicture", "test/assets/robotFaceIcon.png");

      let response = await request.get(`/user/${u._id}/profile_picture`).query({ size: 100 });
      expect(response.status).toBe(200);

      response = await request.get(`/user/${u._id}/profile_picture`);
      expect(response.status).toBe(200);
    });
  });

  describe("DELETE /user/@me/profile_picture", function () {
    it("should return 204", async () => {
      const p = new Profile(request);
      const u = await p.createUser();

      await request.post("/user/@me/profile_picture").set("Authorization", `Bearer ${u.accessToken}`).attach("profilePicture", "test/assets/robotFaceIcon.png");

      let response = await request.delete("/user/@me/profile_picture").set("Authorization", `Bearer ${u.accessToken}`).attach("profilePicture", "test/assets/robotFaceIcon.png");
      expect(response.status).toBe(204);

      response = await request.get(`/user/${u._id}/profile_picture`);
      expect(response.status).toBe(404);
    });
  });
});
