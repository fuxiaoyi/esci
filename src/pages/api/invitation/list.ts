import type { Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

import { prisma } from "../../../server/db";
import R from "../../../utils/r";

type ReqBody = {
  pageNum: number;
  pageSize: number;
  status: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  // eslint-disable-next-line prefer-const
  let { pageNum = 1, pageSize = 10, status } = req.body as ReqBody;
  if (pageNum < 1) {
    pageNum = 1;
  }
  if (pageSize < 1) {
    pageSize = 10;
  }


  // 构建 where 条件
  const where: Prisma.InvitationWhereInput = {};
  if (status) {
    where.status = status;
  }

  const total = await prisma.invitation.count({
    where
  });
  if (total < 1) {
    return res.json(
      R.success().setData({
        list: [],
        total: 0,
        pageNum,
        pageSize
      })
    );
  }


  const list = await prisma.invitation.findMany({
    skip: (pageNum - 1) * pageSize,
    take: pageSize,
    where,
    orderBy: {
      createDate: 'desc'
    }
  })

  list.map(item => {
    // @ts-ignore
    item.createDate = item.createDate?.toLocaleString();
  })

  return res.json(
    R.success().setData({
      list,
      total,
      pageNum,
      pageSize
    })
  );
}
