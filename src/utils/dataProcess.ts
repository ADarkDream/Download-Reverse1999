import { api_getImgInfo } from "@/apis/download/download"

/**从官方接口获取图片链接
 * @param {number} pageSize - 每页数量
 * @param {number} current - 当前页码
 */
export const getImgUrl = async (pageSize: number = 1, current: number = 1) => {
  try {
    const { code, data, msg } = await api_getImgInfo(pageSize, current)
    if (code === 200 && data) {
      const { pageData, total, current, pageSize } = data
      console.log("获取图片链接成功", data)

      console.log(`共有${total}条数据，当前第${current}页，每页${pageSize}条数据`)
      const urlArr = pageData
        .map((item) => item.pictureUrl)
        .filter((url: string) => url !== undefined)
      // console.log(urlArr)
      return { urlArr, total }
    } else throw new Error(msg || "未知错误，获取图片链接失败")
  } catch (error) {
    console.error("获取图片链接失败:", error)
    return { urlArr: [], total: 0 }
  }
}
