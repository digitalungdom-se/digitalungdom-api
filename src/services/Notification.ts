import { ObjectID } from "mongodb";

import { UserModel, UserNotificationType } from "models";
import { IUserNotification } from "interfaces";

export class NotificationService {
  constructor(private readonly User: typeof UserModel) {}

  public async newNotification(userID: ObjectID, type: UserNotificationType, data: any): Promise<IUserNotification> {
    const notification: IUserNotification = {
      _id: new ObjectID(),
      type,
      data,
    };

    await this.User.updateOne({ _id: userID }, { $push: { notifications: notification } });

    return notification;
  }

  public async getNotifications(userID: ObjectID, skip: number, limit: number): Promise<Array<IUserNotification>> {
    const user = await this.User.findOne({ _id: userID }, { _id: 0, notifications: 1 });

    return (user?.notifications || []).reverse().slice(skip, skip + limit);
  }

  public async readNotifications(userID: ObjectID, notificationIDs: Array<ObjectID>): Promise<void> {
    await this.User.updateOne({ _id: userID }, { $set: { "notifications.$[notification].read": true } }, { arrayFilters: [{ "notification._id": { $in: notificationIDs } }] });
  }

  public async readAllNotifications(userID: ObjectID): Promise<void> {
    await this.User.updateOne({ _id: userID }, { $set: { "notifications.$[].read": true } });
  }

  public async deleteNotifications(userID: ObjectID, notificationIDs: Array<ObjectID>): Promise<void> {
    await this.User.updateOne({ _id: userID }, { $pull: { notifications: { _id: { $in: notificationIDs } } } });
  }

  public async deleteAllNotifications(userID: ObjectID): Promise<void> {
    await this.User.updateOne({ _id: userID }, { $set: { notifications: [] } });
  }

  public async deleteReadNotifications(userID: ObjectID): Promise<void> {
    await this.User.updateOne({ _id: userID }, { $pull: { notifications: { read: true } } });
  }
}
