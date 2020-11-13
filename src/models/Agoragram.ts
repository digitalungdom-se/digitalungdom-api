import { prop, getModelForClass, Ref, pre, modelOptions, Severity, index } from "@typegoose/typegoose";
import mongoose from "mongoose";

import { randomBase58String } from "utils";

import { User } from "./";
import { ObjectID } from "mongodb";

export enum AgoragramType {
  Text = "TEXT",
  Link = "LINK",
  Question = "QUESTION",
  Comment = "COMMENT",
}

export enum AgoragramDisplayType {
  User = "USER",
}

class Display {
  @prop({ enum: AgoragramDisplayType, type: mongoose.SchemaTypes.String })
  public type!: AgoragramDisplayType;

  @prop({ type: mongoose.SchemaTypes.Mixed })
  public display?: ObjectID | Array<ObjectID>;
}

class Post {
  @prop({ ref: "Agoragram", justOne: true })
  public _id!: Ref<Agoragram>;

  @prop({ type: mongoose.SchemaTypes.String })
  public shortID!: string;
}

class AgoragramChild {
  @prop({ ref: "Agoragram", justOne: true })
  public agoragram!: Ref<Agoragram>;

  @prop({ type: mongoose.SchemaTypes.Number })
  public stars!: number;
}

@pre<Agoragram>("save", function () {
  if (this.isNew) {
    this.shortID = randomBase58String(7);
  }
})
@index({ title: "text", body: "text", tags: "text" })
@modelOptions({ options: { allowMixed: Severity.ALLOW } })
export class Agoragram {
  @prop({ ref: "User", justOne: true })
  public author?: Ref<User>;

  @prop({ unique: true, type: mongoose.SchemaTypes.String })
  public shortID?: string;

  @prop({ type: mongoose.SchemaTypes.String })
  public body!: string;

  @prop({ type: mongoose.SchemaTypes.Date })
  public modified?: Date;

  @prop({ type: mongoose.SchemaTypes.Date })
  public pinned?: Date;

  @prop({ type: mongoose.SchemaTypes.Date })
  public deleted?: Date;

  @prop({ default: 0, type: mongoose.SchemaTypes.Number })
  public stars?: number;

  @prop({ type: mongoose.SchemaTypes.Number })
  public commentAmount?: number;

  @prop({ type: mongoose.SchemaTypes.Array, default: [], _id: false })
  public children?: Array<AgoragramChild>;

  @prop({ enum: AgoragramType, type: mongoose.SchemaTypes.String })
  public type!: AgoragramType;

  @prop({ type: mongoose.SchemaTypes.String })
  public title?: string;

  @prop({ type: mongoose.SchemaTypes.Array, default: undefined })
  public tags?: Array<string>;

  @prop({ _id: false, type: Display })
  public display!: Display;

  @prop({ type: Post })
  public post?: Post;

  @prop({ ref: "Agoragram", justOne: true })
  public replyTo?: Ref<Agoragram>;
}

const AgoragramModel = getModelForClass(Agoragram);

export { AgoragramModel };
