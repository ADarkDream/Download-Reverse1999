import momo from "@/apis/index"
import { VersionItem } from "@/types/download"
import { UpdateResult } from "@/types/update"

export const api_checkUpdate = async () => {
  const result = await momo.get<UpdateResult>("/getLatestVersion")
  // console.log("/api_checkUpdate返回的数据为：", result)
  return result
}

/**获取1999版本信息*/
export const api_getVersionInfo = async () => {
  const result = await momo.get<{ versionList: VersionItem[] }>("/getVersion", {
    version: "all",
  })
  // console.log("/api_getVersionInfo返回的数据为：", result)
  return result
}

// console.log("api_getVersionInfo", api_getVersionInfo)

// getVersionInfo: async (checkTime: string, checkVersion?: number) => {
//   try {
//     const response = await fetch("https://muxidream.cn/api/getVersion?version=all", {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//       },
//     })

//     if (!response.ok) {
//       throw new Error(`HTTP error! Status: ${response.status}`)
//     }

//     const result = await response.json()
//     const { code, data, msg } = result

//     if (code === 200) {
//       const { versionList } = data
//       console.log("获取到的版本信息为：", versionList)

//       //判断需要检查的时间，服务器的版本信息是否存在于
//       let isExist = false
//       const newVersionList = versionList.map((item) => {
//         if (item.time.includes(Number(checkTime)) || item.version === Number(checkVersion))
//           isExist = true
//         return {
//           version: item.version,
//           versionName: item.versionName,
//           time: item.time,
//         }
//       })
//       if (isExist) {
//         config.versions = newVersionList
//         fs.writeFileSync(config_path, JSON.stringify(config, null, 2))
//         console.warn("版本信息已更新,请重新启动程序")
//         process.exit(0)
//       } else throw new Error("默默的小站版本信息未更新，请等待更新或自行添加版本信息")
//     } else throw new Error("获取默默的小站版本信息失败")
//   } catch (err) {
//     const msg = err instanceof Error && err?.message
//     if (msg === "fetch failed") console.error("获取版本信息失败，本次未覆盖本地版本信息:", err)
//     else if (msg) console.error(msg + "，本次未覆盖本地版本信息:")
//     else console.error("获取版本信息失败，本次未覆盖本地版本信息:", err)
//   }
// }
