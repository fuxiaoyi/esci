import type { Recordable, PageData } from "../../types/global";
import { nextPost } from "../../utils/nextRequest";

export function getInvitationList(data: Recordable) {
  return nextPost<PageData>("/invitation/list", data)
}

export function genInvitation() {
  return nextPost("/invitation/gen")
}
