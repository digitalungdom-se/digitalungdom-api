import { ObjectID } from "mongodb";

import { UserNotificationType } from "models";
import { mongoose } from "@typegoose/typegoose";

export interface IUserNotification {
  _id: ObjectID;
  type: UserNotificationType;
  data?: mongoose.Types.Map<any>;
}
