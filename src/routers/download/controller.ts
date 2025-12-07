import { asyncHandler } from "@/middleware/index"
import { routerMerge } from "@/routers/controller"
import fun from "@/utils/dataProcess"
import { config, download_status } from "@/configs/download"

/**
 * 将前端传递的数字数组格式化
 * @param raw 前端传递的字符串或数组
 * - 接受类型： string | string[] | number[]
 * - 为空时返回空数组
 */
const formatArray = (raw: any): number[] => {
  if (typeof raw === "string") raw = JSON.parse(raw)
  if (Array.isArray(raw)) {
    const tempArr = raw.map((v) => Number(v)).filter(Boolean)
    return [...new Set(tempArr)]
  } else if (!raw) return []
  else throw new Error("参数错误")
}

/**
 * 使用默认配置下载壁纸
 * - [get] /download
 * */
const download_router_get = asyncHandler(async (req, res) => {
  //校验并清洗要下载的版本号数组或时间数组
  if ([0, 3, 4].includes(download_status.type)) {
    console.log("|收到下载请求,使用默认配置开始下载")
    fun.start()
  } else console.warn("|收到重复下载请求，忽略")
  return res.ss("已开始下载，请等待下载完成")
}, "下载失败")

/**
 * 通过版本号或版本时间下载壁纸
 * - [get] /download/info
 * */
const download_info_router_get = asyncHandler(async (req, res) => {
  console.log("|收到下载请求", req.query)

  //校验并清洗要下载的版本号数组或时间数组
  const targetVersionArr = formatArray(req.query.targetVersions)
  const targetTimeArr = formatArray(req.query.targetTimes)

  if (targetVersionArr.length === 0 && targetTimeArr.length === 0) {
    throw new Error("缺少必要的参数")
  }
  const timeMap = fun.createTimeMap()
  const missingTimeArr: number[] = []
  targetTimeArr.forEach((time) => {
    if (timeMap[time]) targetVersionArr.push(timeMap[time].version)
    else missingTimeArr.push(time)
  })
  if (missingTimeArr.length)
    return res.ww(`版本时间为${missingTimeArr.join(",")}的信息不存在，请创建该版本信息。`)

  if ([0, 3, 4].includes(download_status.type)) {
    config.targetVersions = [...new Set(targetVersionArr)]
    console.log(`|已收到下载请求，开始下载，目标版本为：${config.targetVersions}`)
    fun.start()
  } else console.warn("|收到重复下载请求，忽略")
  return res.ss("已开始下载，请等待下载完成")
}, "下载失败")

/**
 * 检查下载状态
 * - [get] /download/status
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
      msg += "下载完成，正在处理"
      break
    case 3:
      msg += "处理结束"
      break
    case 4:
      msg += "下载失败"
      break
  }
  console.warn("|已收到问询，" + msg)

  return res.ss({ code: 200, data: download_status, msg })
}, "获取下载状态失败")

/**路由/download*/
export const download_routers = routerMerge({
  get: download_router_get,
})

/**路由/download/info*/
export const download_info_routers = routerMerge({
  get: download_info_router_get,
})

/**路由/download/status*/
export const download_status_routers = routerMerge({
  get: download_status_router_get,
})
