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
  console.log("/api_getImgInfo返回的数据为：", result)
  return result
}

// getImgUrl: async (pageSize = 1, current = 1): Promise<{ urlArr: string[]; total: number }> => {
//     try {
//       const response = await fetch(
//         "https://re.bluepoch.com/activity/official/websites/picture/query",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             current,
//             pageSize,
//           }),
//         },
//       )

//       if (!response.ok) {
//         throw new Error(`HTTP error! Status: ${response.status}`)
//       }

//       const result = await response.json()
//       const { code, data, msg } = result

//       if (code === 200) {
//         const { pageData, total, current, pageSize } = data
//         console.log("获取图片链接成功", data)
//         process.exit(1)
//         console.log(`共有${total}条数据，当前第${current}页，每页${pageSize}条数据`)
//         const urlArr = pageData
//           .map((item) => item.pictureUrl)
//           .filter((url: string) => url !== undefined)
//         // console.log(urlArr)
//         return { urlArr, total }
//       } else throw new Error(msg || "未知错误，获取图片链接失败")
//     } catch (error) {
//       console.error("获取图片链接失败:", error)
//       return { urlArr: [], total: 0 }
//     }
//   },
