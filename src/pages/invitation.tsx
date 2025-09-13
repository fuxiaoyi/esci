import { CopyOutlined } from '@ant-design/icons';
import { Table, Button, Form, message, Card, Select } from 'antd';
import { Pagination } from "antd";
import { getSession } from "next-auth/react";
import React, { useEffect, useState } from 'react';

import * as invitationApi from "../api/invitation";
import type { Recordable } from "../types/global";
import copyToClipboard from "../utils/copyToClipboard";

const columns = [
  {
    title: '邀请码',
    dataIndex: 'code',
    key: 'code',
    render: (code: string) => {
      return (
        <div className="flex items-center">
          <span style={{ width: "280px", display: 'inline-block'}}>{code}</span>
          <CopyOutlined onClick={() => {
            void copyToClipboard(code).then(() => {
              void message.success("复制成功");
            });
          }} />
        </div>
      )
    },
  },
  {
    title: '生成时间',
    dataIndex: 'createDate',
    key: 'createDate',
  },
  {
    title: '使用状态',
    dataIndex: 'status',
    key: 'status',
    render: (text) => {
      if (text === "unUse") {
        return <span className="text-green-500">未使用</span>
      } else if (text === "used") {
        return <span className="text-red-500">已使用</span>
      } else {
        return <span className="text-gray-500">未知</span>
      }
    },
  },
];

const Invitation = () => {
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [status, setStatus] = useState("")
  const [list, setList] = useState([] as Recordable[])
  const [total, setTotal] = useState(0)
  const [addCodeLoading, setAddCodeLoading] = useState(false)

  const genInvitation = () => {
    setAddCodeLoading(true)
    invitationApi.genInvitation().then((res) => {
      setAddCodeLoading(false)
      void message.success("生成成功~")
      setPageNum(1)
      setPageSize(10)
      setStatus("")
      getInvitationList(1, 10, "")
    }).catch(() => {
      setAddCodeLoading(false)
    })
  }

  const getInvitationList = (pageNum: number, pageSize: number, status: string) => {
    void invitationApi.getInvitationList({ pageNum, pageSize, status }).then(res => {
      setList(res.data.list)
      setTotal(res.data.total)
    })
  };

  const changePage = (pageNum: number, pageSize: number) => {
    setPageNum(pageNum)
    setPageSize(pageSize)
    getInvitationList(pageNum, pageSize, status)
  };

  const search = () => {
    setPageNum(1)
    setPageSize(10)
    getInvitationList(1, 10, status)
  };

  useEffect(() => {
    getInvitationList(pageNum, pageSize, status)
  }, [])

  return (
    <div className="min-h-screen p-8 bg-white">
      <Card
        className="shadow-md"
        title={
          <Form
            layout="inline"
          >
            <Form.Item label="使用状态">
              <Select
                style={{ width: 200 }}
                placeholder='请选择使用状态'
                onChange={(val: string) => setStatus(val)}
                options={[
                  { value: '', label: '全部' },
                  { value: 'unUse', label: '未使用' },
                  { value: 'used', label: '已使用' },
                ]}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={search}>搜索</Button>
            </Form.Item>
          </Form>
        }
        extra={
          <Button onClick={genInvitation} loading={addCodeLoading}>生成邀请码</Button>
        }
        styles={{body: {padding: '14px 10px'}}}
      >
        <Table dataSource={list} columns={columns} pagination={false} rowKey="id" />
        <Pagination align="end" current={pageNum} pageSize={pageSize} total={total} onChange={changePage} className="mt-4" />
      </Card>
    </div>
  );
};

export default Invitation;

export async function getServerSideProps(context) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const session = await getSession(context);

  if (!session || !session.user?.superAdmin) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
