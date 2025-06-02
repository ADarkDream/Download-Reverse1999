import { asyncHandler } from "@/middleware/index"
import { CustomResponse, CustomRouter } from "@/types/system"
import { RequestHandler } from "express"

/**
 * 默认成功请求
 */
export const router_success: RequestHandler = asyncHandler(async (req, res: CustomResponse) => {
  return res.ss("服务器连接成功")
}, "服务器连接失败")

/**
 * 默认失败请求(404)
 */
export const router_error: RequestHandler = asyncHandler(async (req, res: CustomResponse) => {
  console.warn("|找不到该地址:" + req.url)
  return res.ee("地址不存在", 404)
}, "服务器连接失败")

/**
 * 默认路由
 * */
const router_default = router_error

/**合并默认路由函数，传入的同名新路由会覆盖默认的get、post、delete、put处理*/
export const routerMerge = (newRouters: Record<string, RequestHandler> = {}): CustomRouter => {
  const defaultRouters = {
    get: router_default,
    post: router_default,
    delete: router_default,
    put: router_default,
  }

  return Object.assign({}, defaultRouters, newRouters)
}
