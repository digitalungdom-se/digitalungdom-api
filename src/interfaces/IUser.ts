import { ObjectID } from "mongodb";

import { Gender } from "models";

export interface IUserInput {
  email: { raw: string };
  firstName: string;
  lastName: string;
  username: string;
  gender: Gender;
  birthdate: Date;
}

export interface IUserPrivate {
  _id: ObjectID;
  details: {
    email: { raw: string; normalised?: string };
    firstName: string;
    lastName: string;
    username: string;
  };
}

export interface IUserPublic {
  _id: ObjectID;
  details: {
    firstName: string;
    lastName: string;
    username: string;
  };
  agora: {
    score: {
      posts: number;
      comments: number;
      stars: number;
      followers: number;
    };
    profile: {
      badges: Array<ObjectID>;
      colour?: string;
      status?: string;
      bio?: string;
      url?: string;
    };
  };
}
