import { ObjectID } from "mongodb";

import { UserNotificationType } from "models";
import { mongoose } from "@typegoose/typegoose";

export interface IUserNotification {
  _id: ObjectID;
  at: Date;
  type: UserNotificationType;
  data?: mongoose.Types.Map<any>;
  read: boolean;
}
