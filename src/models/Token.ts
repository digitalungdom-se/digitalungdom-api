import { prop, getModelForClass, buildSchema, index, Ref, pre } from "@typegoose/typegoose";
import mongoose from "mongoose";
import crypto from "crypto";

import { User } from "./";

export enum TokenType {
  Refresh = "REFRESH",
  EmailLoginCode = "EMAIL_LOGIN_CODE",
  OrganisationJoin = "ORGANISATION_JOIN",
}

@pre<Token>("save", function () {
  if (this.isNew) {
    this.value = crypto.createHash("sha256").update(this.value).digest("base64");
  }
})
@pre<Token>(/.+/, function () {
  if ((this as any).getFilter) {
    const filter = (this as any).getFilter();

    if (filter.value) {
      filter.value = crypto.createHash("sha256").update(filter.value).digest("base64");
    }

    (this as any).setQuery(filter);
  }
})
@index({ expires: 1 }, { expireAfterSeconds: 0 })
export class Token {
  @prop({ enum: TokenType, type: mongoose.SchemaTypes.String })
  public type!: TokenType;

  @prop({ type: mongoose.SchemaTypes.String })
  public value!: string;

  @prop({ type: mongoose.SchemaTypes.Date })
  public expires!: Date;

  @prop({ ref: User, justOne: true })
  public user?: Ref<User>;

  @prop({ type: mongoose.Schema.Types.Map })
  public data?: any;
}

const TokenModel = getModelForClass(Token);
const tokenSchema = buildSchema(Token);

export { TokenModel, tokenSchema };
