import { DocumentType } from "@typegoose/typegoose";
import moment from "moment";
import { MailService } from "@sendgrid/mail";
import { ObjectID } from "mongodb";
import fs from "fs-extra";
import path from "path";

import { UserModel, User, TokenModel, TokenType } from "models";
import { AuthenticationService } from "services";
import { IReturnToken, IUserInput, IUserPrivate, IUserPublic } from "interfaces";
import { generateSimpleEmail, randomBase58String, randomBase62String, randomWordArray } from "utils";
import { Config } from "configs";

export class UserService {
  constructor(private readonly User: typeof UserModel, private readonly Token: typeof TokenModel, private readonly Authentication: AuthenticationService, private readonly Mail: MailService, private readonly config: Config) {}

  public async getUserByID(id: string | ObjectID): Promise<DocumentType<User> | null> {
    return this.User.findById(new ObjectID(id));
  }

  public async getUserByEmail(email: string): Promise<DocumentType<User> | null> {
    return this.User.findOne({ "details.email.normalised": email });
  }

  public async getUserByUsername(username: string): Promise<DocumentType<User> | null> {
    return this.User.findOne({ "details.username": username }).collation({ locale: "en", strength: 2 });
  }

  public async register(userInput: IUserInput): Promise<DocumentType<User>> {
    return this.User.create({ details: userInput });
  }

  public async deleteUser(id: ObjectID): Promise<void> {
    await this.User.deleteOne({ _id: id });
  }

  public async sendEmailLoginCode(email: string): Promise<string> {
    const user = (await this.User.findOne({ "details.email.normalised": email }))!;

    const emailLoginCode = [...randomWordArray(4), randomBase58String(4)].join("-");
    const tokenExpires = moment.utc().add(5, "minutes").toDate();

    const authorisationToken = Buffer.from(`${email}:${emailLoginCode}`).toString("base64");

    await this.Token.create({ type: TokenType.EmailLoginCode, value: emailLoginCode, expires: tokenExpires, user: user._id });

    const emailData = generateSimpleEmail(email, this.config.sendGrid.emailTemplates.login, { login_code: emailLoginCode, authorization_token: authorisationToken });

    await this.Mail.send(emailData);

    return emailLoginCode;
  }

  public async loginWithEmailCode(email: string, code: string): Promise<IReturnToken | null> {
    const [user, token] = await Promise.all([this.User.findOne({ "details.email.normalised": email }), this.Token.findOneAndDelete({ value: code })]);

    if (!user || !token || (token.user as ObjectID).toHexString() !== (user._id as ObjectID).toHexString()) {
      return null;
    }

    const accessToken = this.Authentication.createToken(user._id);

    const refreshToken = {
      value: randomBase62String(256),
      user: user._id,
      expires: moment.utc().add(30, "days").toDate(),
      type: TokenType.Refresh,
    };

    await this.Token.create(refreshToken);

    return { access_token: accessToken, refresh_token: refreshToken.value, expires: 60 * 15, token_type: "bearer" };
  }

  public async set(userID: ObjectID, update: any): Promise<DocumentType<User>> {
    return (await this.User.findOneAndUpdate({ _id: userID }, update))!;
  }

  public async setProfilePicture(userID: ObjectID, tmpPath: string): Promise<void> {
    await fs.move(tmpPath, this.getProfilePicturePath(userID), { overwrite: true });
  }

  public async deleteProfilePicture(userID: ObjectID): Promise<void> {
    const profilePicturePath = this.getProfilePicturePath(userID);
    const exists = await fs.pathExists(profilePicturePath);
    if (exists) {
      await fs.remove(profilePicturePath);
    }
  }

  public getProfilePicturePath(userID: ObjectID): string {
    return path.join(this.config.storageDir, "profile_pictures", userID.toHexString());
  }

  public toUserPrivate(user: DocumentType<User>): IUserPrivate {
    return {
      _id: user._id,
      details: {
        email: user.details.email,
        firstName: user.details.firstName,
        lastName: user.details.lastName,
        username: user.details.username,
        gender: user.details.gender,
        birthdate: user.details.birthdate,
      },
    };
  }

  public toUserPublic(user: DocumentType<User>): IUserPublic {
    return {
      _id: user._id,
      details: {
        username: user.details.username,
        firstName: user.details.firstName,
        lastName: user.details.lastName,
      },
      agora: {
        profile: user.agora!.profile as any,
        score: user.agora!.score,
      },
    };
  }
}
