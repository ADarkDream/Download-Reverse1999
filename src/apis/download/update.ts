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

  const { code, data, msg } = result

  if (code === 200 && data) {
    const { versionList } = data
    // console.log("获取到的版本信息为：", versionList)
    return versionList
  } else {
    console.log(result)
    throw new Error("获取默默的小站版本信息失败")
  }
}
