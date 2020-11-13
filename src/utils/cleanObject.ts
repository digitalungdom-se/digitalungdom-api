import { pickBy } from "lodash";

export function cleanObject(obj: any): any {
  return pickBy(obj, v => v !== undefined);
}
