const supertest = require("supertest");

const Profile = require("../profile");

const request = supertest("http://localhost:8080");

describe("OAUTH", function () {
  describe("POST /user/oauth/token", function () {
    it("should return 200 for client_credentials", async () => {
      const p = new Profile(request);
      const u = await p.registerUser();

      const codeResp = await request.post("/user/auth/email/send_code").send({ email: u.email });

      const token = Buffer.from(`${u.email}:${codeResp.body}`).toString("base64");

      const tokenResp = await request.post("/user/oauth/token").send({ grant_type: "client_credentials" }).set("Authorization", `Email ${token}`);

      expect(tokenResp.status).toBe(200);
      expect(tokenResp.body.access_token).toBeDefined();
      expect(tokenResp.body.refresh_token).toBeDefined();
      expect(tokenResp.body.expires).toBe(900);
      expect(tokenResp.body.token_type).toBe("bearer");
    });

    it("should return 200 for refresh token", async () => {
      const p = new Profile(request);
      const u = await p.registerUser();

      const codeResp = await request.post("/user/auth/email/send_code").send({ email: u.email });

      const token = Buffer.from(`${u.email}:${codeResp.body}`).toString("base64");

      const tokenResp = await request.post("/user/oauth/token").send({ grant_type: "client_credentials" }).set("Authorization", `Email ${token}`);

      const refreshToken = tokenResp.body.refresh_token;

      const refreshResp = await request.post("/user/oauth/token").send({ grant_type: "refresh_token", refresh_token: refreshToken });

      expect(refreshResp.status).toBe(200);
      expect(refreshResp.body.access_token).toBeDefined();
      expect(refreshResp.body.refresh_token).toBeDefined();
      expect(refreshResp.body.expires).toBe(900);
      expect(refreshResp.body.token_type).toBe("bearer");
    });
  });

  describe("POST /user/oauth/revoke", function () {
    it("should return 200", async () => {
      const p = new Profile(request);
      const u = await p.registerUser();

      const codeResp = await request.post("/user/auth/email/send_code").send({ email: u.email });

      const token = Buffer.from(`${u.email}:${codeResp.body}`).toString("base64");

      const tokenResp = await request.post("/user/oauth/token").send({ grant_type: "client_credentials" }).set("Authorization", `Email ${token}`);

      const response = await request.post("/user/oauth/revoke").send({ token: tokenResp.body.refresh_token });

      expect(response.status).toBe(204);

      const refreshTokenResp = await request.post("/user/oauth/token").send({ grant_type: "refresh_token", refresh_token: tokenResp.body.refresh_token });

      expect(refreshTokenResp.status).toBe(401);
    });
  });
});
