import { Request, Response } from "express";
import { IUserNotification } from "interfaces";

async function getNotifications(req: Request, res: Response): Promise<void> {
  const userID = req.user!._id;
  const skip = (req.query.skip as any) as number;
  const limit = (req.query.limit as any) as number;

  const notifications: Array<IUserNotification> = await req.services.Notification.getNotifications(userID, skip, limit);

  res.status(200).json(notifications);
}

async function deleteNotifications(req: Request, res: Response): Promise<void> {
  const userID = req.user!._id;
  const notificationIDs = req.body.notificationsIDs;
  const onlyRead = req.body.onlyRead;

  if (onlyRead) {
    await req.services.Notification.deleteReadNotifications(userID);
  } else {
    if (notificationIDs) {
      await req.services.Notification.deleteNotifications(userID, notificationIDs);
    } else {
      await req.services.Notification.deleteAllNotifications(userID);
    }
  }

  res.sendStatus(204);
}

async function readNotifications(req: Request, res: Response): Promise<void> {
  const userID = req.user!._id;
  const notificationIDs = req.body.notificationsIDs;

  if (notificationIDs) {
    await req.services.Notification.readNotifications(userID, notificationIDs);
  } else {
    await req.services.Notification.readAllNotifications(userID);
  }

  res.sendStatus(204);
}

export default { getNotifications, deleteNotifications, readNotifications };
