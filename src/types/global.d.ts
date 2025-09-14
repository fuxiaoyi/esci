export type ResData<D = unknown> = {
  msg: string
  code: number
  data: D
}

export type PageData<I = unknown> = {
  pageNum: number
  pageSize: number
  list: I[]
  total: number
}

export type Recordable<V = unknown> = Record<string, V>;
