const supertest = require("supertest");

const request = supertest("http://localhost:8080");

describe("System", function () {
  describe("/health", function () {
    it("should return 200", async () => {
      const response = await request.get("/health");

      expect(response.status).toBe(200);
    });
  });
});
