import { body, query } from "express-validator";

import { sanitizers } from "utils";

const getNotifications = [query("skip").isInt({ min: 0 }).toInt(), query("limit").isInt({ min: 1, max: 100 }).toInt()];
const readNotifications = [
  body("notificationsIDs").optional({ nullable: false, checkFalsy: true }).isArray({ max: 1024 }),
  body("notificationsIDs.*").optional({ nullable: false, checkFalsy: true }).isString().isMongoId().customSanitizer(sanitizers.toObjectID),
];
const deleteNotifications = [
  body("notificationsIDs").optional({ nullable: false, checkFalsy: true }).isArray({ max: 1024 }),
  body("notificationsIDs.*").optional({ nullable: false, checkFalsy: true }).isString().isMongoId().customSanitizer(sanitizers.toObjectID),
  body("onlyRead").optional({ nullable: false, checkFalsy: true }).isBoolean().toBoolean(),
];

export default { getNotifications, deleteNotifications, readNotifications };
