import { ObjectID } from "mongodb";

function toObjectID(value: string): ObjectID | null {
  if (!ObjectID.isValid(value)) {
    return null;
  }

  return new ObjectID(value);
}

export const sanitizers = {
  toObjectID,
};
