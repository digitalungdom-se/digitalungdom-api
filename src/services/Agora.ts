import { DocumentType } from "@typegoose/typegoose";
import moment from "moment";
import { ObjectID } from "mongodb";

import { UserModel, AgoragramModel, Agoragram, AgoragramType, NotificationModel, NotificationType, NotificationReportType, UserNotificationType } from "models";
import { IPostCreate, ICommentCreate } from "interfaces";
import { NotificationService } from "./Notification";

export class AgoraService {
  constructor(private readonly Agoragram: typeof AgoragramModel, private readonly User: typeof UserModel, private readonly Notification: NotificationService) {}

  public async getAgoragram(id: ObjectID): Promise<DocumentType<Agoragram> | null> {
    return this.Agoragram.findById(id);
  }

  public async getAgoragramByShortID(shortID: string): Promise<Agoragram | null> {
    return this.Agoragram.findOne({ shortID });
  }

  public async getPostByID(id: ObjectID): Promise<Array<DocumentType<Agoragram>>> {
    return this.Agoragram.find({ $or: [{ _id: id }, { "post._id": id }] })
      .populate({ path: "author", model: "User", select: ["details.username", "details.firstName", "details.lastName"] })
      .exec();
  }

  public async getPostByShortID(shortID: string): Promise<Array<DocumentType<Agoragram>>> {
    return this.Agoragram.find({ $or: [{ shortID }, { "post.shortID": shortID }] })
      .populate({ path: "author", model: "User", select: ["details.username", "details.firstName", "details.lastName"] })
      .exec();
  }

  public async getPosts(sortBy: "NEW" | "TOP", skip: number, limit: number, optional?: { fromID?: ObjectID; hypagora?: ObjectID; authorID?: ObjectID }): Promise<Array<DocumentType<Agoragram>>> {
    let sort;
    if (sortBy === "NEW") {
      sort = { _id: -1 };
    } else {
      sort = { stars: -1 };
    }

    const query: any = { type: { $ne: AgoragramType.Comment } };

    if (optional) {
      if (optional.fromID) {
        query._id = { $gte: optional.fromID };
      }

      if (optional.hypagora) {
        query.hypagora = optional.hypagora;
      }

      if (optional.authorID) {
        query.author = optional.authorID;
      }
    }

    return this.Agoragram.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({ path: "author", model: "User", select: ["details.username", "details.firstName", "details.lastName"] })
      .exec();
  }

  public async createPost(authorID: ObjectID, postData: IPostCreate): Promise<DocumentType<Agoragram>> {
    const [agoragram] = await Promise.all([this.Agoragram.create({ author: authorID, ...postData, commentAmount: 0 }), this.User.updateOne({ _id: authorID }, { $inc: { "agora.score.posts": 1 } })]);

    return agoragram;
  }

  public async createComment(authorID: ObjectID, commentData: ICommentCreate): Promise<DocumentType<Agoragram>> {
    const commentID = new ObjectID();

    const replyTo = (await this.Agoragram.findOneAndUpdate({ _id: commentData.replyTo }, { $push: { children: { agoragram: commentID, stars: 0 } } }, { projection: { _id: 1, type: 1, post: 1, shortID: 1, author: 1 } }))!;

    let post;
    if (replyTo.type === AgoragramType.Comment) {
      post = replyTo.post;
    } else {
      post = {
        _id: replyTo._id,
        shortID: replyTo.shortID!,
      };
    }

    const promisedArray = [
      this.Agoragram.create({ _id: commentID, author: authorID, ...commentData, type: AgoragramType.Comment, post }),
      this.Agoragram.updateOne({ _id: post!._id }, { $inc: { commentAmount: 1 } }),
      this.User.updateOne({ _id: authorID }, { $inc: { "agora.score.comments": 1 } }),
    ];

    if (replyTo.type === AgoragramType.Comment) {
      if ((replyTo.author as ObjectID).toHexString() !== authorID.toHexString()) {
        promisedArray.push(this.Notification.newNotification(replyTo.author as ObjectID, UserNotificationType.CommentOnComment, { comment: replyTo._id, post: replyTo.post!._id }).then());
      }

      const post = await this.Agoragram.findOne({ _id: replyTo.post!._id });

      if ((post!.author as ObjectID).toHexString() !== authorID.toHexString()) {
        promisedArray.push(this.Notification.newNotification(post!.author as ObjectID, UserNotificationType.CommentOnPost, { post: post!._id }).then());
      }
    } else if ((replyTo.author as ObjectID).toHexString() !== authorID.toHexString()) {
      promisedArray.push(this.Notification.newNotification(replyTo.author as ObjectID, UserNotificationType.CommentOnPost, { post: replyTo._id }).then());
    }

    const [agoragram] = await Promise.all(promisedArray);

    return agoragram;
  }

  public async deleteAgoragram(id: ObjectID): Promise<void> {
    const agoragram = await this.Agoragram.findOneAndUpdate({ _id: id }, { $set: { deleted: moment.utc().toDate() }, $unset: { author: "", display: "", body: "" } });

    if (agoragram!.children!.length === 0) {
      await agoragram!.deleteOne();
    }
  }

  public async updateAgoragram(id: ObjectID, body: string): Promise<DocumentType<Agoragram>> {
    return (await this.Agoragram.findOneAndUpdate({ _id: id }, { $set: { body, modified: moment.utc().toDate() } }, { new: true }))!;
  }

  public async starAgoragram(userID: ObjectID, agoragramID: ObjectID): Promise<"STARRED" | "UNSTARRED"> {
    let queryArray: Array<Promise<any>> = [];

    const starredAgoragram = await this.Agoragram.findOne({ _id: agoragramID });

    const starredByUser = !(await this.User.updateOne({ _id: userID }, { $addToSet: { "agora.starredAgoragrams": agoragramID } })).nModified;

    let star = 1;
    if (starredByUser) {
      queryArray.push(this.User.updateOne({ _id: userID }, { $pull: { "agora.starredAgoragrams": agoragramID } }).then());
      star = -1;
    }

    if (starredAgoragram?.author) {
      queryArray.push(this.User.updateOne({ _id: starredAgoragram.author }, { $inc: { "agora.score.stars": star } }).then());
    }

    // Gets the replyToID (only comments have this field) and increments it's stars at the same time. Database god.
    queryArray.push(this.Agoragram.findOneAndUpdate({ _id: agoragramID }, { $inc: { stars: star } }, { projection: { _id: 0, replyTo: 1 } }).then());

    queryArray = [];

    if (starredAgoragram && starredAgoragram.replyTo) {
      const children = (await this.Agoragram.findOneAndUpdate({ "_id": starredAgoragram.replyTo, "children._id": agoragramID }, { $inc: { "children.$.stars": star } }, { projection: { _id: 0, children: 1 }, new: true }))!.children!.sort(
        (a, b) => b.stars! - a.stars!,
      );

      await this.Agoragram.updateOne({ _id: starredAgoragram.replyTo }, { $set: { children: children } });
    }

    const action = star === 1 ? "STARRED" : "UNSTARRED";

    return action;
  }

  public async report(reportType: NotificationReportType, reportedID: ObjectID, notifierID: ObjectID, reason: string): Promise<void> {
    const report = {
      type: reportType,
      reported: reportedID,
      notifier: notifierID,
      reason,
    };

    await NotificationModel.create({
      type: NotificationType.Report,
      report,
    });
  }

  public async checkIfStarred(userID: ObjectID, agoragramIDs: Array<ObjectID>): Promise<{ [id: string]: true }> {
    const starredAgoragrams = ((await this.User.aggregate([{ $match: { _id: userID } }, { $project: { starredAgoragrams: { $filter: { input: "$agora.starredAgoragrams", as: "agoragram", cond: { $in: ["$$agoragram", agoragramIDs] } } }, _id: 0 } }]))[0] as any)
      ?.starredAgoragrams as Array<ObjectID>;

    const starredAgoragramHashMap: { [id: string]: true } = {};
    starredAgoragrams.forEach(id => (starredAgoragramHashMap[id.toHexString()] = true));

    return starredAgoragramHashMap;
  }

  public async search(searchString: string): Promise<{ agoragrams: any; users: any }> {
    const promiseArray: Array<Promise<any>> = [];
    const searchRegex = new RegExp(searchString, "i"); // eslint-disable-line

    promiseArray.push(
      this.Agoragram.aggregate([
        {
          $match: { $text: { $search: searchString } },
        },
        { $sort: { score: { $meta: "textScore" } } },
        { $limit: 10 },
        { $project: { _id: 1, title: 1, author: 1, body: 1, type: 1, tags: 1, shortID: 1, stars: 1, commentAmount: 1, score: 1 } },
        {
          $lookup: {
            from: "users",
            as: "author",
            let: { author: "$author" },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$author"] } } }, { $project: { "_id": 1, "details.firstName": 1, "details.lastName": 1, "details.username": 1 } }],
          },
        },
        { $unwind: "$author" },
      ]).then(),
    );

    promiseArray.push(
      this.User.aggregate([
        {
          $addFields: {
            name: {
              $concat: ["$details.firstName", " ", "$details.lastName"],
            },
          },
        },
        {
          $match: { $or: [{ name: searchRegex }, { "details.username": searchRegex }] },
        },
        { $limit: 3 },
        {
          $project: {
            "_id": 1,
            "details.firstName": 1,
            "details.lastName": 1,
            "details.username": 1,
          },
        },
      ]).then(),
    );

    const [agoragrams, users] = await Promise.all(promiseArray);

    return { agoragrams, users };
  }
}
