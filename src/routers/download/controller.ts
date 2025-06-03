import { asyncHandler } from "@/middleware/index"
import { routerMerge } from "@/routers/controller"
import fun from "@/utils/dataProcess"
/**
 * 示例路由：
 * - [get] /download
 * - 函数 asyncHandler 通过 throw new Error('错误信息') 进行错误返回，并自动进行接口的400状态码返回，
 * - 若返回的错误信息优先级为：error.message >底部配置的错误信息(此处是"连接失败")> "未知错误"
 * */
const download_router_get = asyncHandler(async (req, res) => {
  console.log("开始下载")
  fun.start()
  return res.ss("[get]/download请求成功")
}, "下载失败")

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
  get: download_router_get,
})

/**示例路由/test/aaa*/
export const aaa_routers = routerMerge({
  get: test_aaa_router_get,
})
