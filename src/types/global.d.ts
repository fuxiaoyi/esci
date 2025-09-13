export type ResData<D = any> = {
  msg: string
  code: number
  data: D
}

export type PageData<I = any> = {
  pageNum: number
  pageSize: number
  list: I[]
  total: number
}

export type Recordable<V = any> = Record<string, V>;
