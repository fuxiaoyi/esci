import type { NextApiRequest, NextApiResponse } from "next";

import { supabaseDb } from "../../../lib/supabase-db";
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

  try {
    const result = await supabaseDb.getInvitations(pageNum, pageSize, status);

    // Format the list to match the expected response format
    const formattedList = result.list.map(item => ({
      ...item,
      createDate: item.createDate?.toLocaleString()
    }));

    return res.json(
      R.success().setData({
        list: formattedList,
        total: result.total,
        pageNum: result.pageNum,
        pageSize: result.pageSize
      })
    );
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return res.status(500).json(
      R.fail("Failed to fetch invitations")
    );
  }
}
