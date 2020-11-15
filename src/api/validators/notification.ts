import { body, query } from "express-validator";

import { sanitizers } from "utils";

const getNotifications = [query("skip").isInt({ min: 0 }).toInt(), query("limit").isInt({ min: 1, max: 100 }).toInt()];
const readNotifications = [body("notificationsIDs").optional().isArray({ max: 1024 }), body("notificationsIDs.*").optional().isString().isMongoId().customSanitizer(sanitizers.toObjectID)];
const deleteNotifications = [body("notificationsIDs").optional().isArray({ max: 1024 }), body("notificationsIDs.*").optional().isString().isMongoId().customSanitizer(sanitizers.toObjectID), body("onlyRead").optional().isBoolean().toBoolean()];

export default { getNotifications, deleteNotifications, readNotifications };
