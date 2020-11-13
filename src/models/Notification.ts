import mongoose from "mongoose";

import { prop, getModelForClass } from "@typegoose/typegoose";

export enum NotificationType {
  Report = "REPORT",
}

export enum NotificationReportType {
  Agoragram = "AGORAGRAM",
  Profile = "PROFILE",
}

class Report {
  @prop({ type: mongoose.SchemaTypes.String, enum: NotificationReportType })
  public type!: NotificationReportType;

  @prop({ type: mongoose.SchemaTypes.ObjectId })
  public reported!: mongoose.Types.ObjectId;

  @prop({ type: mongoose.SchemaTypes.ObjectId })
  public notifier!: mongoose.Types.ObjectId;

  @prop({ type: mongoose.SchemaTypes.String })
  public reason!: string;
}

export class Notification {
  @prop({ enum: NotificationType, type: mongoose.SchemaTypes.String })
  public type!: NotificationType;

  @prop({ type: Report })
  public report?: Report;
}

const NotificationModel = getModelForClass(Notification);

export { NotificationModel };
