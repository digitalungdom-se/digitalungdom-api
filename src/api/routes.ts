import "express-async-errors";

import { Router } from "express";
import multer from "multer";

import { validatorWrapper, controllerWrapper, ensureUserAuthenticated } from "./middlewares";

import controllers from "./controllers";
import validators from "./validators";

const router = Router();

const storage = multer.diskStorage({});

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 mb max file size
  storage,
});

// Health route to check if instance is up
router.get("/health", (_, res) => {
  res.sendStatus(200);
});

// OAuth routes
router.post("/user/oauth/token", controllerWrapper(controllers.oauth.newToken));
router.post("/user/oauth/revoke", controllerWrapper(controllers.oauth.revokeToken));

// User routes
router.get("/user", validatorWrapper(validators.user.getUser), controllerWrapper(controllers.user.getUser));
router.post("/user/register", validatorWrapper(validators.user.register), controllerWrapper(controllers.user.register));
router.post("/user/auth/email/send_code", validatorWrapper(validators.user.sendEmailLoginCode), controllerWrapper(controllers.user.sendEmailLoginCode));
router.get("/user/@me", ensureUserAuthenticated, controllerWrapper(controllers.user.auth));
router.put("/user/@me", ensureUserAuthenticated, validatorWrapper(validators.user.updateUser), controllerWrapper(controllers.user.updateUser));
router.delete("/user/@me", ensureUserAuthenticated, controllerWrapper(controllers.user.deleteUser));
router.post("/user/@me/profile_picture", ensureUserAuthenticated, upload.single("profilePicture"), controllerWrapper(controllers.user.setProfilePicture));
router.get("/user/:userID/profile_picture", validatorWrapper(validators.user.getProfilePicture), controllerWrapper(controllers.user.getProfilePicture));

router.get("/agoragram", validatorWrapper(validators.agora.getPosts), controllerWrapper(controllers.agora.getPosts));
router.post("/agoragram", ensureUserAuthenticated, validatorWrapper(validators.agora.createAgoragram), validatorWrapper(validators.agora.createPost), controllerWrapper(controllers.agora.createPost));
router.get("/agoragram/:agoragramID", controllerWrapper(controllers.agora.getPost));
router.put("/agoragram/:agoragramID", ensureUserAuthenticated, validatorWrapper(validators.agora.updateAgoragram), controllerWrapper(controllers.agora.updateAgoragram));
router.delete("/agoragram/:agoragramID", ensureUserAuthenticated, validatorWrapper(validators.agora.deleteAgoragram), controllerWrapper(controllers.agora.deleteAgoragram));
router.post("/agoragram/:agoragramID/comment", ensureUserAuthenticated, validatorWrapper(validators.agora.createAgoragram), validatorWrapper(validators.agora.createComment), controllerWrapper(controllers.agora.createComment));
router.post("/agoragram/:agoragramID/star", ensureUserAuthenticated, validatorWrapper(validators.agora.starAgoragram), controllerWrapper(controllers.agora.starAgoragram));

router.get("/notification", ensureUserAuthenticated, validatorWrapper(validators.notification.getNotifications), controllerWrapper(controllers.notifications.getNotifications));
router.put("/notification", ensureUserAuthenticated, validatorWrapper(validators.notification.readNotifications), controllerWrapper(controllers.notifications.readNotifications));
router.delete("/notification", ensureUserAuthenticated, validatorWrapper(validators.notification.deleteNotifications), controllerWrapper(controllers.notifications.deleteNotifications));

router.get("/agora/search", validatorWrapper(validators.agora.search), controllerWrapper(controllers.agora.search));

export default router;
