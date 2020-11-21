import { Request, Response } from "express";
import { ObjectID } from "mongodb";

import { IPostCreate, ICommentCreate } from "interfaces";
import { AgoragramDisplayType } from "models";
import validator from "validator";

async function getPosts(req: Request, res: Response): Promise<void> {
  const userID = req.user?._id;
  const sort = req.query.sort as "NEW" | "TOP";
  const skip = (req.query.skip as any) as number;
  const limit = (req.query.limit as any) as number;
  const fromID = req.query.fromID as undefined | ObjectID;
  const hypagora = req.query.hypagora as undefined | ObjectID;
  const authorID = req.query.authorID as undefined | ObjectID;

  const posts = await req.services.Agora.getPosts(sort, skip, limit, { fromID, hypagora, authorID });

  let starredAgoragrams: { [id: string]: true } = {};

  if (userID) {
    const agoragramIDs = posts.map(agoragram => agoragram._id);
    starredAgoragrams = await req.services.Agora.checkIfStarred(userID, agoragramIDs);
  }

  const postsReturn = posts.map(agoragram => {
    const agoragramReturn: any = req.services.Agora.toAgoragramPost(agoragram);
    agoragramReturn.starred = starredAgoragrams[agoragram._id.toHexString()] ? true : false;
    return agoragramReturn;
  });

  res.status(200).json(postsReturn);
}

async function getPost(req: Request, res: Response): Promise<void> {
  const userID = req.user?._id;
  const agoragramID = req.params.agoragramID;

  let postAndComments;

  if (validator.isMongoId(agoragramID)) {
    postAndComments = await req.services.Agora.getPostByID(new ObjectID(agoragramID));
  } else {
    postAndComments = await req.services.Agora.getPostByShortID(agoragramID);
  }

  if (postAndComments.length === 0) {
    res.sendStatus(404);
    return;
  }

  let starredAgoragrams: { [id: string]: true } = {};

  if (userID) {
    const agoragramIDs = postAndComments.map(agoragram => agoragram._id);
    starredAgoragrams = await req.services.Agora.checkIfStarred(userID, agoragramIDs);
  }

  const postReturn = postAndComments.map(agoragram => {
    const agoragramReturn: any = req.services.Agora.toAgoragramPostAndComments(agoragram);
    agoragramReturn.starred = starredAgoragrams[agoragram._id.toHexString()] ? true : false;
    return agoragramReturn;
  });

  res.status(200).json(postReturn);
}

async function createPost(req: Request, res: Response): Promise<void> {
  const userID = req.user!._id;
  const postInput: IPostCreate = {
    body: req.body.body,
    type: req.body.type,
    title: req.body.title,
    tags: req.body.tags,
    hypagora: req.body.hypagora,
    display: { type: AgoragramDisplayType.User },
  };

  const agoragram = await req.services.Agora.createPost(userID, postInput);

  const agoragramReturn = req.services.Agora.toAgoragramPost(agoragram);

  res.status(201).json(agoragramReturn);
}

async function createComment(req: Request, res: Response): Promise<void> {
  const userID = req.user!._id;
  const commentInput: ICommentCreate = {
    body: req.body.body,
    replyTo: new ObjectID(req.params.agoragramID),
    display: { type: AgoragramDisplayType.User },
  };

  const agoragram = await req.services.Agora.createComment(userID, commentInput);

  const agoragramReturn = req.services.Agora.toAgoragramPostAndComments(agoragram);

  res.status(201).json(agoragramReturn);
}

async function updateAgoragram(req: Request, res: Response): Promise<void> {
  const agoragramID = new ObjectID(req.params.agoragramID);
  const body = req.body.body;

  const agoragram = await req.services.Agora.updateAgoragram(agoragramID, body);

  const agoragramReturn = req.services.Agora.toAgoragramPostAndComments(agoragram);

  res.status(200).json(agoragramReturn);
}

async function deleteAgoragram(req: Request, res: Response): Promise<void> {
  const agoragramID = new ObjectID(req.params.agoragramID);

  await req.services.Agora.deleteAgoragram(agoragramID);

  res.sendStatus(204);
}

async function starAgoragram(req: Request, res: Response): Promise<void> {
  const userID = req.user!._id;
  const agoragramID = new ObjectID(req.params.agoragramID);

  const action = await req.services.Agora.starAgoragram(userID, agoragramID);

  res.status(200).json({ action, agoragramID });
}

async function search(req: Request, res: Response): Promise<void> {
  const query = req.query.query as string;

  const results = await req.services.Agora.search(query);

  res.status(200).json(results);
}

export default { createPost, createComment, updateAgoragram, deleteAgoragram, starAgoragram, getPosts, getPost, search };
