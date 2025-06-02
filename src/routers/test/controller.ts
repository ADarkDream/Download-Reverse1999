import { asyncHandler } from "@/middleware/index"
import { routerMerge } from "@/routers/controller"

/**
 * 示例路由：
 * - [get] /test
 * - 函数 asyncHandler 通过 throw new Error('错误信息') 进行错误返回，并自动进行接口的400状态码返回，
 * - 若返回的错误信息优先级为：error.message >底部配置的错误信息(此处是"连接失败")> "未知错误"
 * */
const test_router_get = asyncHandler(async (req, res) => {
  //这里处理要返回的数据
  // return res.ss() 或 res.ww() 或 res.ee() 进行返回
  return res.ss("[get]/test请求成功")
}, "连接失败")

/**
 * 示例路由：
 * - /test/aaa
 * */
const test_aaa_router_get = asyncHandler(async (req, res) => {
  //这里处理要返回的数据
  // return res.ss() 或 res.ww() 或 res.ee() 进行返回
  return res.ss("[get]/test/aaa请求成功")
}, "连接失败")

/**示例路由/test*/
export const main_routers = routerMerge({
  get: test_router_get,
})

/**示例路由/test/aaa*/
export const aaa_routers = routerMerge({
  get: test_aaa_router_get,
})
