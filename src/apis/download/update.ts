import momo from "@/apis/index"
import { UpdateResult } from "@/types/update"

export const api_checkUpdate = async () => {
  const result = await momo.get<UpdateResult>(process.env.UPDATE_API! + "/getLatestVersion")
  console.log("/api_checkUpdate返回的数据为：", result)
  return result
}
