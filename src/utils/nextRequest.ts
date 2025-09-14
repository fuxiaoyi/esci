import { message } from "antd";

import { RCodeConstant } from "../constant/RCodeConstant";
import type { ResData } from "../types/global";

export default function nextRequest<D>(url: string, method?: string, body?: unknown) {
  return fetch("/api" + url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
    .then(async (res) => {
      if (res.status === 200) {
        const resData = await res.json() as ResData<D>;

        if (resData.code !== RCodeConstant.SUCCESS) {
          void message.error(resData.msg);
          return Promise.reject(new Error(resData.msg));
        }

        return Promise.resolve(resData);
      }

      void message.error(res.statusText);
      return Promise.reject(new Error(res.statusText));
    })
    .catch((err) => {
      return Promise.reject(err instanceof Error ? err : new Error(String(err)));
    })
}

export function nextPost<D>(url: string, body?: unknown){
  return nextRequest<D>(url, "POST", body);
}
