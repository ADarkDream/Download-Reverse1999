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
