import { asyncHandler } from "@/middleware/index"
import { routerMerge } from "@/routers/controller"
import fun from "@/utils/dataProcess"
import { config, download_status } from "@/configs/download"
/**
 * 示例路由：
 * - [get] /download
 * - 函数 asyncHandler 通过 throw new Error('错误信息') 进行错误返回，并自动进行接口的400状态码返回，
 * - 若返回的错误信息优先级为：error.message >底部配置的错误信息(此处是"连接失败")> "未知错误"
 * */
const download_router_get = asyncHandler(async (req, res) => {
  let targetVersions: number[] = []
  //校验并清洗要下载的版本号
  const raw = req.query.targetVersions
  if (Array.isArray(raw)) {
    const tempArr = raw.map((v) => Number(v)).filter(Boolean)
    targetVersions = [...new Set(tempArr)]
  } else return res.ee("参数错误")
  console.log("|已收到下载请求，开始下载，目标版本为：", targetVersions)

  if ([0, 3, 4].includes(download_status.type)) {
    config.targetVersions = targetVersions
    fun.start()
  } else console.warn("|收到重复下载请求，忽略")
  return res.ss("已开始下载，请等待下载完成")
}, "下载失败")

/**
 * 示例路由：
 * - /download/status
 * */
const download_status_router_get = asyncHandler(async (req, res) => {
  //这里处理要返回的数据
  const { type, total } = download_status
  let msg = `获取下载状态成功,共有${total}张图片，当前`
  switch (type) {
    case 0:
      msg += "未开始下载"
      break
    case 1:
      msg += "下载中"
      break
    case 2:
      msg += "下载完成"
      break
    case 3:
      msg += "下载结束"
      break
    case 4:
      msg += "下载失败"
      break
  }
  console.warn("|已收到问询，" + msg)

  return res.ss({ code: 200, data: download_status, msg })
}, "获取下载状态失败")

/**示例路由/test*/
export const download_routers = routerMerge({
  get: download_router_get,
})

/**示例路由/download/status*/
export const download_status_routers = routerMerge({
  get: download_status_router_get,
})
