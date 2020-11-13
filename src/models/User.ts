import { prop, getModelForClass, pre, index } from "@typegoose/typegoose";
import validator from "validator";
import { ObjectID } from "mongodb";
import mongoose from "mongoose";

export enum Gender {
  Male = "MALE",
  Female = "FEMALE",
  Other = "OTHER",
  Undisclosed = "UNDISCLOSED",
}

export enum UserNotificationType {
  CommentOnPost = "COMMENT_ON_POST",
  CommentOnComment = "COMMENT_ON_COMMENT",
}

class Email {
  @prop({ type: mongoose.SchemaTypes.String })
  public raw!: string;

  @prop({ type: mongoose.SchemaTypes.String, index: true })
  public normalised?: string;
}

class UserDetails {
  @prop({ type: mongoose.SchemaTypes.String })
  public firstName!: string;

  @prop({ type: mongoose.SchemaTypes.String })
  public lastName!: string;

  @prop({ _id: false, type: Email })
  public email!: Email;

  @prop({ type: mongoose.SchemaTypes.String })
  public username!: string;

  @prop({ enum: Gender, type: mongoose.SchemaTypes.String })
  public gender!: Gender;
}

class Score {
  @prop({ default: 0, type: mongoose.SchemaTypes.Number })
  public posts!: number;

  @prop({ default: 0, type: mongoose.SchemaTypes.Number })
  public comments!: number;

  @prop({ default: 0, type: mongoose.SchemaTypes.Number })
  public stars!: number;

  @prop({ default: 0, type: mongoose.SchemaTypes.Number })
  public followers!: number;
}

class Profile {
  @prop({ default: [], type: mongoose.SchemaTypes.Array })
  public badges!: Array<mongoose.Schema.Types.ObjectId>;

  @prop({ type: mongoose.SchemaTypes.String })
  public colour?: string;

  @prop({ type: mongoose.SchemaTypes.String })
  public status?: string;

  @prop({ type: mongoose.SchemaTypes.String })
  public bio?: string;

  @prop({ type: mongoose.SchemaTypes.String })
  public url?: string;
}

class Agora {
  @prop({ default: [], type: mongoose.SchemaTypes.Array })
  public followedHypagoras!: Array<ObjectID>;

  @prop({ default: [], type: mongoose.SchemaTypes.Array })
  public followedUsers!: Array<ObjectID>;

  @prop({ default: [], type: mongoose.SchemaTypes.Array })
  public starredAgoragrams!: Array<ObjectID>;

  @prop({ _id: false, type: Score, default: new Score() })
  public score!: Score;

  @prop({ _id: false, type: Profile, default: new Profile() })
  public profile!: Profile;
}

class UserNotification {
  @prop({ type: mongoose.SchemaTypes.ObjectId })
  public _id!: ObjectID;

  @prop({ type: mongoose.SchemaTypes.Date })
  public at!: Date;

  @prop({ enum: UserNotificationType, type: mongoose.SchemaTypes.String })
  public type!: UserNotificationType;

  @prop({ type: mongoose.Schema.Types.Map })
  public data?: any;

  @prop({ default: false, type: mongoose.SchemaTypes.Boolean })
  public read!: boolean;
}

@pre<User>("save", async function () {
  if (this.details.email.raw && validator.isEmail(this.details.email.raw)) {
    this.details.email.normalised = validator.normalizeEmail(this.details.email.raw) as string;
  }
})
@pre<User>(/.+/, function () {
  if ((this as any).getFilter) {
    const filter = (this as any).getFilter();

    if (filter["details.email.normalised"] && validator.isEmail(filter["details.email.normalised"])) {
      filter["details.email.normalised"] = validator.normalizeEmail(filter["details.email.normalised"]);
    }

    (this as any).setQuery(filter);
  }
})
@index({ "details.username": 1 }, { collation: { locale: "en", strength: 2 }, unique: true })
@index({ "details.email.normalised": 1 }, { unique: true })
export class User {
  @prop({ _id: false, type: UserDetails })
  public details!: UserDetails;

  @prop({ _id: false, type: Agora, default: new Agora() })
  public agora?: Agora;

  @prop({ default: [], type: mongoose.SchemaTypes.Array, _id: false })
  public notifications?: Array<UserNotification>;
}

const UserModel = getModelForClass(User);

export { UserModel };
