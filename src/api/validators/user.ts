import { body, query, param } from "express-validator";
import { Request } from "express";

const getUser = [
  query("email").optional({ nullable: true, checkFalsy: true }).isString().isEmail().normalizeEmail(),
  query("username").optional({ nullable: true, checkFalsy: true }).isString().isLength({ max: 128 }),
  query("_id").optional({ nullable: true, checkFalsy: true }).isString().isMongoId(),
];

const sendEmailLoginCode = [
  body("email")
    .isString()
    .isEmail()
    .normalizeEmail()
    .custom(async (email: string, meta) => {
      const req = meta.req as Request;

      const user = await req.services.User.getUserByEmail(email);

      if (!user) {
        throw new Error();
      }

      return true;
    }),
];

const register = [
  body("email")
    .isString()
    .isEmail()
    .custom(async (email: string, meta) => {
      const req = meta.req as Request;

      const user = await req.services.User.getUserByEmail(email);

      if (user) {
        throw new Error();
      }

      return true;
    }),

  body("username")
    .isString()
    .isLength({ min: 3, max: 24 })
    .matches(/^(\w+)$/)
    .custom(async function (username: string, meta) {
      const req = meta.req as Request;

      const user = await req.services.User.getUserByUsername(username);

      if (user) {
        throw new Error();
      }

      return true;
    }),

  body("firstName").isString().isLength({ min: 1, max: 512 }),
  body("lastName").isString().isLength({ min: 1, max: 512 }),
  body("birthdate").isISO8601({ strict: true }).isBefore().toDate(),
  body("gender").isString().isIn(["MALE", "FEMALE", "OTHER", "UNDISCLOSED"]),
];

const updateUser = [
  body("username")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .isLength({ min: 3, max: 24 })
    .matches(/^(\w+)$/)
    .custom(async function (username: string, meta) {
      const req = meta.req as Request;

      const user = await req.services.User.getUserByUsername(username);

      if (user) {
        throw new Error();
      }

      return true;
    }),

  body("firstName").optional({ nullable: true, checkFalsy: true }).isString().isLength({ min: 1, max: 512 }),
  body("lastName").optional({ nullable: true, checkFalsy: true }).isString().isLength({ min: 1, max: 512 }),
  body("birthdate").optional({ nullable: true, checkFalsy: true }).isISO8601({ strict: true }).isBefore().toDate(),
  body("gender").optional({ nullable: true, checkFalsy: true }).isString().isIn(["MALE", "FEMALE", "OTHER", "UNDISCLOSED"]),
  body("profileColour").optional({ nullable: true, checkFalsy: true }).isString().isHexColor(),
  body("profileStatus").optional({ nullable: true, checkFalsy: true }).isString().isLength({ min: 0, max: 32 }),
  body("profileBio").optional({ nullable: true, checkFalsy: true }).isString().isLength({ min: 0, max: 1000 }),
  body("profileURL")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .isURL({ protocols: ["http", "https"] }),
];

const getProfilePicture = [param("userID").isString().isMongoId(), query("size").optional({ checkFalsy: true, nullable: false }).isInt({ min: 0, max: 1024 }).toInt()];

export default { getUser, register, updateUser, sendEmailLoginCode, getProfilePicture };
