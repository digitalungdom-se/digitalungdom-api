const { v4 } = require("uuid");
const crypto = require("crypto");
const { report } = require("process");

class Profile {
  constructor(request) {
    this.request = request;
    this.users = [];
  }

  async createUser() {
    const user = new User(this.request);
    await user.register();
    await user.login();
    this.users.push(user);

    return user;
  }

  async registerUser() {
    const user = new User(this.request);
    await user.register();
    this.users.push(user);

    return user;
  }
}

const GENDERS = ["MALE", "FEMALE", "OTHER", "UNDISCLOSED"];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

randomDate(new Date(2012, 0, 1), new Date());

class User {
  constructor(request) {
    this.request = request;
    this._id = "";
    this.email = `${v4()}@${v4()}.com`;
    this.firstName = v4();
    this.lastName = v4();
    this.gender = GENDERS[Math.floor(Math.random() * GENDERS.length)];
    this.username = crypto
      .randomBytes(16)
      .toString("base64")
      .replace(/[+.=/]/g, "");
    this.birthdate = randomDate(new Date("1950-01-01T00:00:00.000Z"), new Date("2005-12-31T00:00:00.000Z")).toISOString();
    this.accessToken = "";
    this.refreshToken = "";
  }

  async register() {
    const resp = await this.request.post("/user/register").send({ email: this.email, firstName: this.firstName, lastName: this.lastName, gender: this.gender, birthdate: this.birthdate, username: this.username });
    this._id = resp.body._id;
  }

  async login() {
    const codeResp = await this.request.post("/user/auth/email/send_code").send({ email: this.email });

    const token = Buffer.from(`${this.email}:${codeResp.body}`).toString("base64");

    const tokenResp = await this.request.post("/user/oauth/token").send({ grant_type: "client_credentials" }).set("Authorization", `Email ${token}`);

    this.accessToken = tokenResp.body.access_token;
    this.refreshToken = tokenResp.body.refresh_token;
  }

  async refreshAccessToken() {
    const tokenResp = await this.request.post("/user/oauth/token").send({ grant_type: "refresh_token", refresh_token: this.refreshToken });

    this.accessToken = tokenResp.body.access_token;
    this.refreshToken = tokenResp.body.refresh_token;
  }

  async createPost() {
    const post = new Post(this);
    await post.create();

    return post;
  }

  async get(route, query) {
    return await this.request.get(route).query(query).set("Authorization", `Bearer ${this.accessToken}`);
  }

  async post(route, body) {
    return await this.request.post(route).send(body).set("Authorization", `Bearer ${this.accessToken}`);
  }

  async put(route, body) {
    return await this.request.put(route).send(body).set("Authorization", `Bearer ${this.accessToken}`);
  }

  async delete(route, body) {
    return await this.request.delete(route).send(body).set("Authorization", `Bearer ${this.accessToken}`);
  }
}

class Post {
  constructor(author) {
    this.user = author;
    this._id = undefined;
    this.author = author._id;
    this.shortID = undefined;
    this.title = v4();
    this.body = v4() + v4() + v4();
    this.modified = undefined;
    this.pinned = undefined;
    this.deleted = undefined;
    this.stars = 0;
    this.commentAmount = 0;
    this.children = [];
    this.type = "TEXT";
    this.tags = [v4().substring(0, 30), v4().substring(0, 26), v4().substring(0, 13)];
    this.display = undefined;
  }

  async create() {
    const agoragram = {
      body: this.body,
      title: this.title,
      tags: this.tags,
      type: this.type,
    };

    const response = await this.user.post("/agoragram", agoragram);

    this._id = response.body._id;
    this.shortID = response.body.shortID;
    this.display = response.body.display;
  }

  async comment(author) {
    const comment = new Comment(author, this);
    await comment.create();

    return comment;
  }
}

class Comment {
  constructor(author, replyTo) {
    this.user = author;
    this._id = undefined;
    this.author = author._id;
    this.body = v4() + v4() + v4();
    this.modified = undefined;
    this.pinned = undefined;
    this.deleted = undefined;
    this.stars = 0;
    this.children = [];
    this.type = "COMMENT";
    this.display = undefined;

    if (replyTo.type === "COMMENT") {
      this.post = replyTo.post;
    } else {
      this.post = {
        _id: replyTo._id,
        shortID: replyTo.shortID,
      };
    }

    this.replyTo = replyTo._id;
  }

  async create() {
    const agoragram = {
      body: this.body,
    };

    const response = await this.user.post(`/agoragram/${this.replyTo}/comment`, agoragram);

    this._id = response.body._id;
    this.shortID = response.body.shortID;
    this.display = response.body.display;
  }

  async comment(author) {
    const comment = new Comment(author, this);
    await comment.create();

    return comment;
  }
}

module.exports = Profile;
