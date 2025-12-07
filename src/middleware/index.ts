// 中间件模块
import { Request, NextFunction, RequestHandler } from "express"
import { CustomResponse, CtxHandler } from "@/types/system"

/**全局中间件，精简res.send()*/
export const send = (req: Request, res: CustomResponse, next: NextFunction) => {
  res.ss = (data, status = 200) => {
    if (typeof data === "string") return res.send({ code: status, msg: data })
    const { code, ...restData } = data
    res.send({
      code: code || status || 200,
      ...restData,
    })
  }

  res.ww = (data, status = 300) => {
    if (typeof data === "string") return res.send({ code: status, msg: data })
    const { code, ...restData } = data
    res.send({
      code: code || status || 300,
      ...restData,
    })
  }

  res.ee = (err: Error | string, status = 400) => {
    res.send({
      code: status,
      //判断得到的err是系统的Error对象还是传递的字符串信息
      msg: err instanceof Error ? err.message : err,
    })
  }
  next()
}

/**全局错误中间件,捕获未捕获的错误(在app末尾使用)*/
export const errorHandler = (err: Error, req: Request, res: CustomResponse, next: NextFunction) => {
  console.error("|发生了错误：", err)
  // JWT错误
  if (err.name === "UnauthorizedError") {
    if (err.message === "jwt expired") {
      res.ee("身份认证已过期,请重新登录！", 401)
    } else if (err.message === "No authorization token was found") {
      res.ee("您尚未登录,请先登录！", 402)
    } else {
      console.error("|未知JWT错误：" + err.message)
      res.ee(`未知错误：${err.message}`)
    }
  } else {
    console.error("|发生了未知错误")
    res.ee(err?.message || "未知错误")
  }
}

/**
 * 封装异步请求处理，支持自定义错误消息
 * @param handler - 异步处理函数
 * @param defaultErrorMessage - 默认错误消息
 * @returns Express中间件函数
 */

export function asyncHandler(
  handler: CtxHandler,
  defaultErrorMessage = "未知错误",
): RequestHandler {
  // 改为返回标准的 RequestHandler
  return async (req, res, next) => {
    try {
      await handler(req, res as CustomResponse, next)
    } catch (err: any) {
      const msg = err?.message || defaultErrorMessage
      console.error("|路由错误捕获：", msg)
      //因为加了类型断言，所以加了;()
      ;(res as CustomResponse).ee?.(msg)
    }
  }
}

/**
 * 强制将query或body中的某些字段转换为数组
 * @param {string[]} fields 需要转换的字段
 * @param {boolean} isBody 是query还是body
 * @description 前端传数组过来时，需要手动处理。前端通过qs.stringify()格式化数组，当数组只有一个参数时，还会被移除[]然后被识别成字符串
 * */
export const forceQueryToArray = (fields: string[], isBody: boolean = false) => {
  return (req: Request, res: CustomResponse | Response | any, next: NextFunction) => {
    const tempData = isBody ? req.body : req.query
    for (const key of fields) {
      const val = tempData[key]
      if (val !== undefined && !Array.isArray(val)) {
        console.log("val", key, val)
        tempData[key] = [val]
      }
    }
    if (isBody) req.body = tempData
    else {
      req.query = tempData
    }
    console.log("req", req.query, req.body)

    next()
  }
}

const middleware = {
  send,
  errorHandler,
  asyncHandler,
  forceQueryToArray,
}

export default middleware
