import { Request, Response } from "express";
import { IUserPrivate, IUserInput, IUserPublic } from "interfaces";
import fileType from "file-type";
import fs from "fs-extra";
import sharp from "sharp";
import imageSize from "image-size";
import { promisify } from "util";
import { ObjectID } from "mongodb";
import { cleanObject } from "utils";

const sizeOf = promisify(imageSize);
sharp.cache(false);

async function register(req: Request, res: Response): Promise<void> {
  const userInput: IUserInput = {
    email: { raw: req.body.email },
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    username: req.body.username,
    gender: req.body.gender,
    birthdate: req.body.birthdate,
  };

  const userData = await req.services.User.register(userInput);

  const user: IUserPrivate = {
    _id: userData._id,
    details: {
      email: userData.details.email,
      firstName: userData.details.firstName,
      lastName: userData.details.lastName,
      username: userData.details.username,
      gender: userData.details.gender,
      birthdate: userData.details.birthdate,
    },
  };

  res.status(201).json(user);
}

async function auth(req: Request, res: Response): Promise<void> {
  const userID = req.user!._id;

  const userData = (await req.services.User.getUserByID(userID))!;

  const user: IUserPrivate = {
    _id: userData._id,
    details: {
      email: userData.details.email,
      firstName: userData.details.firstName,
      lastName: userData.details.lastName,
      username: userData.details.username,
      gender: userData.details.gender,
      birthdate: userData.details.birthdate,
    },
  };

  res.status(200).json(user);
}

async function sendEmailLoginCode(req: Request, res: Response): Promise<void> {
  const email = req.body.email;

  const loginCode = await req.services.User.sendEmailLoginCode(email);

  if (process.env.NODE_ENV === "development") {
    res.json(loginCode);
    return;
  }

  res.sendStatus(204);
}

async function getUser(req: Request, res: Response): Promise<void> {
  let user;
  if (req.query.email) {
    const email = req.query.email as string;
    user = await req.services.User.getUserByEmail(email);
  } else if (req.query.username) {
    const username = req.query.username as string;
    user = await req.services.User.getUserByUsername(username);
  } else if (req.query._id) {
    const id = req.query._id as string;
    user = await req.services.User.getUserByID(id);
  }

  if (!user) {
    res.sendStatus(404);
    return;
  }

  const userReturn: IUserPublic = {
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

  res.status(200).json(userReturn);
}

async function deleteUser(req: Request, res: Response): Promise<void> {
  const userID = req.user!._id;

  await req.services.User.deleteUser(userID);

  res.sendStatus(204);
}

async function setProfilePicture(req: Request, res: Response): Promise<void> {
  const userID = req.user!._id;
  const tmpFilePath = req.file.path;

  if (!tmpFilePath) {
    res.sendStatus(422);
    return;
  }

  const [ft, imgSize] = await Promise.all([fileType.fromFile(tmpFilePath), sizeOf(tmpFilePath)]);

  if (!ft || !["image/png", "image/jpeg", "image/gif"].includes(ft.mime) || !imgSize || !imgSize.width || !imgSize.height || imgSize.width / imgSize.height !== 1) {
    await fs.remove(tmpFilePath);
    res.sendStatus(422);
    return;
  }

  await req.services.User.setProfilePicture(userID, tmpFilePath);

  res.sendStatus(201);
}

async function getProfilePicture(req: Request, res: Response): Promise<void> {
  const userID = new ObjectID(req.params.userID);
  const size = req.query.size as number | undefined;

  const profilePicturePath = req.services.User.getProfilePicturePath(userID);

  const profilePictureExists = await fs.pathExists(profilePicturePath);
  if (!profilePictureExists) {
    res.sendStatus(404);
    return;
  }

  const ft = await fileType.fromFile(profilePicturePath);
  let profilePicture;
  if (size) {
    profilePicture = await sharp(profilePicturePath).resize(size).toBuffer();
  } else {
    profilePicture = await fs.readFile(profilePicturePath);
  }

  res.contentType(ft!.mime);
  res.send(profilePicture);
}

async function updateUser(req: Request, res: Response): Promise<void> {
  const userID = req.user!._id;
  const update = cleanObject({
    "details.username": req.body.username,
    "details.firstName": req.body.firstName,
    "details.lastName": req.body.lastName,
    "details.birthdate": req.body.birthdate,
    "details.gender": req.body.gender,
    "agora.profile.colour": req.body.profileColour,
    "agora.profile.status": req.body.profileStatus,
    "agora.profile.bio": req.body.profileBio,
    "agora.profile.url": req.body.profileURL,
  });

  await req.services.User.set(userID, update);

  res.sendStatus(204);
}

export default { register, sendEmailLoginCode, auth, getUser, deleteUser, setProfilePicture, getProfilePicture, updateUser };
