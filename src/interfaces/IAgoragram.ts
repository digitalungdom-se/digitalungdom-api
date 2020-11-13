import { ObjectID } from "mongodb";

import { AgoragramType, AgoragramDisplayType } from "models";

export interface IPostCreate {
  body: string;
  type: AgoragramType;
  title: string;
  tags: Array<string>;
  hypagora?: ObjectID;
  display: { type: AgoragramDisplayType; _id?: ObjectID | Array<ObjectID> };
}

export interface ICommentCreate {
  body: string;
  replyTo: ObjectID;
  display: { type: AgoragramDisplayType; _id?: ObjectID | Array<ObjectID> };
}

export interface IAgoragram {
  _id: ObjectID;
  author?: ObjectID;
  shortID: string;
  title?: string;
  body: string;
  modified?: Date;
  pinned?: Date;
  deleted?: Date;
  stars: number;
  commentAmount?: number;
  children: Array<{ agoragram: ObjectID; stars: number }>;
  type: AgoragramType;
  tags?: Array<string>;
  display?: { type: AgoragramDisplayType; _id?: ObjectID | Array<ObjectID> };
  post?: { _id: ObjectID; shortID: string };
  replyTo?: ObjectID;
  starred?: boolean;
}
