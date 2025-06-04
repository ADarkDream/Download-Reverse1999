import momo from "@/apis/index"
import { DownloadResult } from "@/types/api"
// import { VersionParams } from "@/types/reverse1999"

// /**获取版本列表或角色列表*/
// export const api_getVersion = async (params: VersionParams, isAdmin = false) => {
//   const result = await momo.get<{
//     versionList: VersionInfo[]
//     roleList: Role[]
//   }>(isAdmin ? "/getAllVersion" : "/getVersion", params)
//   console.log("/返回的数据为：", result)
//   return result
// }

/**从官方接口获取图片链接*/
export const api_getImgInfo = async (pageSize = 1, current = 1) => {
  const result = await momo.post<DownloadResult>(
    "https://re.bluepoch.com/activity/official/websites/picture/query",
    {
      current,
      pageSize,
    },
  )
  // console.log("/api_getImgInfo返回的数据为：", result)
  return result
}
