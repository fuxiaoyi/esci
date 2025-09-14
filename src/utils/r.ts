import { RCodeConstant } from "../constant/RCodeConstant";

export default class R<D = unknown> {
  msg = '';
  code = undefined as undefined | number;
  data = null as D | null;

  setMsg(msg: string) {
    this.msg = msg;
    return this;
  }
  setCode(code: number) {
    this.code = code;
    return this;
  }
  setData(data: D) {
    this.data = data;
    return this;
  }

  static success(msg = "success") {
    const r = new R();
    r.msg = msg;
    r.code = RCodeConstant.SUCCESS;
    return r;
  }


  static fail(msg = "fail") {
    const r = new R();
    r.msg = msg;
    r.code = RCodeConstant.FAIL;
    return r;
  }
}
