import type { Recordable } from "../../types/global";
import { nextPost } from "../../utils/nextRequest";

export function sendEmail(data: Recordable) {
  return nextPost("/thirdpart/sendEmail", data)
}
