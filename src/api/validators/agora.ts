import { body, param, query } from "express-validator";
import { Request } from "express";

import { sanitizers } from "utils";
import { ObjectID } from "mongodb";

const getPosts = [
  query("sort").isString().isIn(["NEW", "TOP"]),
  query("skip").isInt({ min: 0 }).toInt(),
  query("limit").isInt({ min: 1, max: 100 }).toInt(),
  query("fromID").optional().isString().isMongoId().customSanitizer(sanitizers.toObjectID),
  query("hypagora").optional().isString().isMongoId().customSanitizer(sanitizers.toObjectID),
  query("authorID").optional().isString().isMongoId().customSanitizer(sanitizers.toObjectID),
];

const createAgoragram = [body("body").isString().isLength({ min: 0, max: 10000 })];

const createPost = [
  body("type").isString().isIn(["TEXT", "LINK", "QUESTION"]),

  body("title").isString().isLength({ min: 3, max: 100 }),

  body("body")
    .if((_: string, { req }: any) => req.body.type === "LINK")
    .isURL({ protocols: ["http", "https"] }),

  body("tags").isArray({ max: 5 }),
  body("tags.*").isString().isLength({ min: 1, max: 32 }),
];

const createComment = [
  body("body").isLength({ min: 1, max: 10000 }),

  param("agoragramID")
    .isString()
    .isMongoId()
    .customSanitizer(sanitizers.toObjectID)
    .custom(async function (replyTo: ObjectID, meta) {
      const req = meta.req as Request;

      const replyAgoragram = await req.services.Agora.getAgoragram(replyTo);
      if (!replyAgoragram) {
        throw new Error();
      }

      return true;
    }),
];

const deleteAgoragram = [
  param("agoragramID")
    .isString()
    .isMongoId()
    .customSanitizer(sanitizers.toObjectID)
    .custom(async function (agoragramID: ObjectID, meta) {
      const req = meta.req as Request;
      const userID = req.user!._id;

      const agoragram = await req.services.Agora.getAgoragram(agoragramID);

      if (!agoragram || (agoragram.author as ObjectID).toHexString() !== userID.toHexString()) {
        throw new Error();
      }

      return true;
    }),
];

const updateAgoragram = [
  param("agoragramID")
    .isString()
    .isMongoId()
    .customSanitizer(sanitizers.toObjectID)
    .custom(async function (agoragramID, meta) {
      const req = meta.req as Request;
      const userID = req.user!._id;

      const agoragram = await req.services.Agora.getAgoragram(agoragramID);

      if (!agoragram || (agoragram.author as ObjectID).toHexString() !== userID.toHexString()) {
        throw new Error();
      }

      return true;
    }),

  body("body").isLength({ min: 1, max: 10000 }),
];

const starAgoragram = [
  param("agoragramID")
    .isString()
    .isMongoId()
    .customSanitizer(sanitizers.toObjectID)
    .custom(async function (agoragramID, meta) {
      const req = meta.req as Request;

      const agoragram = await req.services.Agora.getAgoragram(agoragramID);

      if (!agoragram) {
        throw new Error();
      }

      return true;
    }),
];

const search = [query("query").isString().isLength({ max: 128 })];

export default { getPosts, createAgoragram, createPost, createComment, deleteAgoragram, updateAgoragram, starAgoragram, search };
