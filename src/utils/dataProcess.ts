import fs from "fs"
import https from "https"
import path from "path"
import { fileURLToPath } from "url"
import probe from "probe-image-size" // 检查图片分辨率
import semver from "semver"
import dotenv from "dotenv"
import { dic_md5 } from "@/utils/dictionary"
import { config, download_status, resetDownloadStatus } from "@/configs/download"
import { formatWaitTime, countdown } from "@/utils/time"

import { TimeVersionMap, ImageInfo } from "@/types/download"
import { api_checkUpdate, api_getVersionInfo } from "@/apis/download/update"
import { api_getImgInfo } from "@/apis/download/download"

dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` })

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)

/**从官方接口获取图片链接
 * @param {number} pageSize - 每页数量
 * @param {number} current - 当前页码
 */
export const getImgUrl = async (pageSize: number = 1, current: number = 1) => {
  try {
    const { code, data, msg } = await api_getImgInfo(pageSize, current)
    if (code === 200 && data) {
      const { pageData, total, current, pageSize } = data
      // console.log("获取图片链接成功", data)

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

/**
 * 检查文件夹是否存在，如果不存在则创建
 * @param {string[]} dirs - 文件夹路径数组
 * @param {boolean} recursive - 是否递归创建
 * */
export const checkAndCreateDir = (dirs: string[], recursive: boolean = true) => {
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive })
    }
  })
}

/**
 * 判断是否存在filePath（url.txt）文件，若存在则从中读取下载链接
 * 若不存在则从深蓝接口获取图片链接
 * */
export const getAllUrls = async () => {
  let allUrl = []
  const filePath = config.filePath
  if (fs.existsSync(filePath)) {
    console.log("已读取到" + filePath + "文件，将下载本地文件内的链接")
    //从filePath文件中读取数据，并分割字符串
    const data = fs.readFileSync(filePath).toString()
    allUrl = [...data.matchAll(/(https?|http|ftp|file):\/\/.*\.jpg/g)].map((match) => match[0])
  } else {
    console.warn("没有找到" + filePath + "文件，将使用深蓝接口进行下载图片")
    //使用深蓝接口,并根据要下载的版本号清洗链接
    allUrl = await fun.getImgUrlByAPI()
  }
  allUrl = [...new Set(allUrl)] //图片链接数组,通过Set函数去重

  if (!allUrl.length) throw new Error("图片链接数组为空")
  console.warn("将要下载的图片数量为：", allUrl.length)
  return allUrl
}

/**
 * 根据官方上传时间(版本时间)和图片命名序号排序
 * - 排序逻辑：先按 time 从小到大，再按 index 从小到大
 * */
export const resortImgInfo = (imgInfoArr: ImageInfo[]) => {
  console.log("分类完成，开始排序")
  const newArr = imgInfoArr.sort((a, b) => {
    if (a.time === b.time) {
      return a.index - b.index // time 相同，按 index 排序
    }
    return Number(a.time) - Number(b.time) //按 time 排序
    // return a.time.localeCompare(b.time); // 如果time是字符串，按 time 排序（字符串比较）
  })
  console.log("排序完成，图片信息处理完成")
  return newArr
}

/**
 * 检查当前版本是否为最新版本
 */
export const checkVersion = async (wait_time: number = 5) => {
  if (!config.isCheckUpdate) return
  console.warn("|正在检查更新，若不需要每次启动时检查更新可在配置文件 config.json 中关闭")

  try {
    const result = await api_checkUpdate()
    const { code, msg, data } = result

    if (code !== 200 || !data) {
      console.error(msg || "未知错误，检查版本号失败")
      return
    }
    console.log("|检查版本号成功")

    const { download_version, server_version, update_url } = data
    const localVersion = config.localVersion
    if (semver.gt(localVersion, download_version)) {
      console.error(
        `|当前下载器版本为：${localVersion}，最新下载器版本为：${download_version}。请检查本地版本号是否有误。`,
      )
      await countdown(wait_time)
    } else if (semver.lt(localVersion, download_version)) {
      console.warn(
        `|检查到新版本，当前版本：${localVersion}，最新版本：${download_version}。\n|如需更新请前往：${update_url} 下载最新版。`,
      )
      await countdown(wait_time)
    } else {
      console.log(`|当前下载器版本为：${localVersion}，已是最新版本。\n`)
    }
  } catch (error) {
    const msg = "|检查版本号失败"
    if (error instanceof Error) console.error(msg + "：" + error.message)
    else console.error(msg)
  }
}

/**如果是下载模式，则结束进程，服务模式不结束*/
export const exit = (status = 0) => {
  if (status === 0) {
    console.error("|关闭程序即可退出")
  } else {
    throw new Error("终止本次服务")
  }
}

//#region 主函数

/**当前环境*/
const isDev = process.env.NODE_ENV === "development"
/**当前路径*/
// const currentPath = isDev ? __dirname : process.cwd()

// 检查config.json是否存在，如果不存在则退出
const config_path = isDev ? "./src/configs/config.json" : "./config.json"

let errorUrlStr = ""
const errorArr: ImageInfo[] = []
let allImgInfoArr = []
// 版本时间和版本名称的映射对象
let timeVersionMap: TimeVersionMap = {}

const pc_dir = isDev ? process.env.PC_DIR : config.PCDir || "./image/PCImg/"
const phone_dir = isDev ? process.env.PHONE_DIR : config.phoneDir || "./image/phoneImg/"

const list_path = isDev ? process.env.LIST_PATH : config.listPath || "./urlList/"
const path_all = list_path + "allUrl.txt"
const path_all_json = list_path + "allUrlList.json"
const path_pc_json = list_path + "PCUrlList.json"
const path_phone_json = list_path + "phoneUrlList.json"
const path_error = list_path + "errorUrl.txt"
const path_error_json = list_path + "errorUrlList.json"

const wait_time = formatWaitTime(config.waitTime)

const fun = {
  //主函数
  start: async () => {
    try {
      resetDownloadStatus()
      // 检查目标文件夹是否存在，如果不存在则创建
      checkAndCreateDir([pc_dir!, phone_dir!, list_path!])

      //创建版本时间和版本名称的映射对象
      fun.createTimeMap()

      //获取要下载的链接
      const allUrl = await getAllUrls()

      download_status.total = allUrl.length

      console.log("开始预处理图片数据")

      //预处理图片信息【清洗数据，获取网址信息】
      allImgInfoArr = allUrl.map(fun.getImgInfo).filter((imgInfo) => imgInfo !== undefined)

      console.log("预处理完成，开始下载")
      download_status.type = 1
      await fun.batchDownload(allImgInfoArr, config.maxConcurrent)
      download_status.type = 2
      console.log("所有文件下载完成,开始按分辨率分类")

      const tempImgInfoArr = await Promise.all(allImgInfoArr.map(fun.reWriteInfo))

      allImgInfoArr = tempImgInfoArr.filter((imgInfo) => imgInfo !== undefined)

      //排序
      allImgInfoArr = resortImgInfo(allImgInfoArr)

      console.warn(
        "\n--  --  --  --  --  --  --  --  --  --  --  -- 目录说明 --  --  --  --  --  --  --  --  --  --  --  --\n" +
          "| 竖屏图片已下载到" +
          phone_dir +
          "目录下\n" +
          "| 横屏图片已下载到" +
          pc_dir +
          "目录下\n" +
          "| 图片各类信息已保存到" +
          list_path +
          "目录下\n" +
          "| 重复的图片只保留一份。" +
          "--  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --\n",
      )
      //分类：分类导出
      const PCUrlArr: ImageInfo[] = []
      const phoneUrlArr: ImageInfo[] = []
      allImgInfoArr.forEach(
        (item) => (item.sort === 0 ? PCUrlArr.push(item) : phoneUrlArr.push(item)), //0为横屏,1为竖屏
      )
      fs.writeFileSync(path_all, allUrl.join("\n")) //全部图片链接
      fs.writeFileSync(path_all_json, JSON.stringify(allImgInfoArr)) //全部图片信息
      fs.writeFileSync(path_pc_json, JSON.stringify(PCUrlArr)) //横屏图片信息
      fs.writeFileSync(path_phone_json, JSON.stringify(phoneUrlArr)) //竖屏图片信息
      console.log(
        `| 网址筛选成功,共${allUrl.length}个链接，图片信息存放到以下文件中（已去除重复链接）：\n` +
          `| ${path_all} 中存放全部壁纸链接[${allImgInfoArr.length}条]（TXT格式,网址通过空行隔开,可以复制到其他下载器批量下载）\n` +
          `| ${path_all_json} 中存放全部壁纸信息[${allImgInfoArr.length}条]（JSON格式）\n` +
          `| ${path_pc_json} 中存放横屏壁纸信息[${PCUrlArr.length}条]（JSON格式）\n` +
          `| ${path_phone_json} 中存放竖屏壁纸信息[${phoneUrlArr.length}条]（JSON格式）`,
      )
      if (errorUrlStr !== "" && errorArr.length !== 0) {
        fs.writeFileSync(path_error, errorUrlStr)
        fs.writeFileSync(path_error_json, JSON.stringify(errorArr))
        console.error(
          "\n| 本次下载有图片下载出错,上述JSON文件中包含下载失败的图片信息，请手动修改错误的图片的分类信息" +
            `${path_error} 中存放可能下载出错的壁纸链接，请自行手动下载\n` +
            `| ${path_error_json} 中存放可能下载出错的壁纸信息[${errorArr.length}条]（JSON格式）\n` +
            "| 建议将已下载的图片和图片信息文件夹备份后,将errorUrl.txt复制并重命名为url.txt,再重新运行本脚本",
        )
      }
      console.warn(
        "\n----------------------------图片下载结束，关闭本窗口即可退出程序-----------------------------",
      )
      download_status.type = 3
      exit(0)
    } catch (err) {
      console.error(
        err instanceof Error &&
          err.message +
            "\n--------------------------------------已停止运行----------------------------------------\n",
      )
      download_status.type = 4
      exit(1)
    }
  },
  //检查最新一张图片以及版本信息是否完整
  checkLatestImgInfo: async () => {
    //获取最新一张，获取总数
    const { urlArr, total } = await getImgUrl()
    const latestUrl = urlArr[0]
    const data = fun.getImgInfo(latestUrl)
    console.warn("最新一张图片信息如下:")
    console.log(data)
    const { time } = data
    await fun.checkVersionIsExist(time)
    return { total }
  },
  /**检查本地是否存在该版本信息，并从云端更新*/
  checkVersionIsExist: async (time: string, version?: number) => {
    if (!timeVersionMap[time]) {
      console.warn("检测到版本信息不完整")
      if (timeVersionMap["19991231"])
        console.log("此版本信息没有官方更新时间(time字段)：", timeVersionMap["19991231"])
      console.warn(
        "如果需要补充版本信息，请在config.json文件中修改time数组、version字段和versionName字段，并重新启动程序。详细字段说明请阅读readme.md文档",
      )
      console.warn(
        "本程序将在" +
          wait_time +
          "秒后尝试从默默的小站获取版本信息，注意此操作会清空并覆盖本地版本信息",
      )
      await countdown(wait_time) // 开始倒计时
      await fun.getVersionInfo(time, version)
      console.log("如果忽略此问题，本程序将在" + wait_time + "秒后开始下载")
      await countdown(wait_time) // 开始倒计时
    }
  },
  //数据清洗方法：计算图片序号
  getIndex: (oldName: string, md5: string, version: number) => {
    let index = Number(oldName.match(/\d{1,3}/g)![0]) //匹配名字开头1-3位连续的数字
    const dic_index = (dic_md5 as { [key: string]: number })[md5]

    // 例外情况靠字典解决
    if (dic_index) index = dic_index
    else if (version === 15) index += 110 //例外情况，1.5版本序号清零，添加110
    return index
  },

  //数据清洗方法：获取图片信息
  getImgInfo: (imgUrl: string) => {
    //分割图片信息
    const strList = imgUrl.split("/")
    const time = strList[strList.length - 2] //这个规则匹配文件夹名，如：20231114
    const oldName = strList[strList.length - 1].replace(/%20/g, " ") //获取图片名称并替换20%为空格，例如：185%201125x2436_16e74393815d4aacbbbbb60c8f106de0.jpg
    //判断版本
    const { version, versionName } = timeVersionMap[time]
      ? timeVersionMap[time]
      : { version: 1999, versionName: "其他版本" }

    const [name, halfName] = oldName.split("_")
    const [md5, format] = halfName.split(".") //分割.符号左右部分, 获取文件后缀名(format)

    const index = fun.getIndex(oldName, md5, version)
    const newName = time + "_" + index + "." + format //拼接新名称  时间_序号.格式

    const sort = 0 //0为横屏壁纸
    const imgPath = pc_dir + newName
    return { oldName, newName, imgUrl, version, versionName, index, time, sort, imgPath, md5 }
  },

  /**
   * 下载文件并保存到指定路径
   * @param {string} url - 下载链接
   * @param {string} outputPath - 保存路径
   */
  downloadFile: async (url: string, outputPath: string) => {
    // console.log(`开始下载: ${url}`);
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(outputPath)
      https
        .get(url, (response) => {
          response.pipe(file)
          file.on("finish", () => {
            file.close(() => {
              // console.log(`完成下载: ${outputPath}`);
              resolve(outputPath)
            })
          })
        })
        .on("error", (err) => {
          console.error(`下载失败: ${outputPath}`)
          fs.unlink(outputPath, () => reject(err))
        })
    })
  },

  /**
   * 批量下载图片到指定路径
   * @param {Array} downloadList - 下载对象数组
   * @param {number} maxConcurrent - 最大并发数量
   */
  batchDownload: async (downloadList: ImageInfo[], maxConcurrent = 3) => {
    let index = 0

    const startNext = async () => {
      while (index < downloadList.length) {
        const currentIndex = index++
        const { imgUrl, imgPath } = downloadList[currentIndex] // 提取 imgUrl 和 imgPath
        try {
          // 确保路径的文件夹存在
          const dir = imgPath.substring(0, imgPath.lastIndexOf("/"))
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

          // 下载文件
          await fun.downloadFile(imgUrl, imgPath)
        } catch (error) {
          console.error(`下载失败: ${imgUrl}`, error)
        }
      }
    }

    const workers = Array.from({ length: config.maxConcurrent }, () => startNext())
    await Promise.all(workers)
  },

  //图片信息终处理，判断图片分辨率并根据分辨率分类
  reWriteInfo: async (imgInfo: ImageInfo) => {
    const PCImgPath = imgInfo.imgPath
    const phoneImgPath = phone_dir + imgInfo.newName

    try {
      // 确保文件已正确写入
      const stats = await fs.promises.stat(PCImgPath)
      if (stats.size === 0) throw new Error(`下载的文件${PCImgPath}为空 (0KB)`)

      // 检查图片分辨率
      const readStream = fs.createReadStream(PCImgPath)
      const dimensions = await probe(readStream)
      imgInfo.height = dimensions.height
      imgInfo.width = dimensions.width

      readStream.destroy() // 关闭流

      // 判断图片类型并分类
      if (dimensions.width < dimensions.height) {
        imgInfo.imgPath = phoneImgPath
        imgInfo.sort = 1 // 1为竖屏壁纸

        // 移动文件到指定位置
        await fs.promises.rename(PCImgPath, phoneImgPath)
      }
      return imgInfo
    } catch (err) {
      console.error(err)
      console.warn(
        `\n${err instanceof Error && err.message}\n图片 ${imgInfo.newName} 可能未移动成功，请检查路径：${PCImgPath} 或路径：${phoneImgPath}\n如图片有问题请手动下载：${imgInfo.imgUrl}`,
      )
      errorUrlStr += imgInfo.imgUrl + "\n"
      errorArr.push(imgInfo)
    }
  },

  //根据要下载的版本号清洗链接
  getImgUrlByAPI: async () => {
    //获取最新一张，获取总数
    console.log("查询最新一张图片，获取总数")
    const { total } = await fun.checkLatestImgInfo()

    //获取全部链接
    const { urlArr } = await getImgUrl(total)
    console.log("查询全部图片链接成功\n")

    const targetVersions = config.targetVersions
    //下载全部
    if (!targetVersions?.length) {
      console.log("将要下载全部以影像之图片")
      return urlArr
    }

    /**去重后的本地版本数字组成的数组*/
    const uniqueVersions = [...new Set(config.versions.map((item) => item.version).filter(Boolean))]

    //检查目标版本是否存在
    for (const version of targetVersions) {
      if (!uniqueVersions.includes(version)) {
        console.warn("版本" + version + "的信息不存在")
        await fun.checkVersionIsExist("", version)
      }
    }

    const targetTimes: string[] = []
    const targetVersionNames: string[] = []
    config.versions.forEach((item) => {
      if (targetVersions.includes(item.version)) {
        for (const time of item.time) {
          targetTimes.push(time.toString())
        }
        targetVersionNames.push(item.versionName)
      }
    })

    //下载目标版本
    console.log("将要下载版本为：【" + targetVersionNames.join(",") + "】的以影像之图片")
    const data = urlArr.filter((url) =>
      targetTimes.some((time) => url.includes(`/PICTURE/${time}/`)),
    )
    console.log("更新时间为：", targetTimes, "\n筛选出" + data.length + "条数据\n", data)

    // 筛选包含 targetTimes 的链接
    return urlArr.filter((url) => targetTimes.some((time) => url.includes(`/PICTURE/${time}/`)))
  },

  createTimeMap: () => {
    timeVersionMap = {}
    // 创建 time 和 version+versionName 的映射对象
    config.versions.forEach((item) => {
      item.time.forEach((time) => {
        timeVersionMap[time] = { version: item.version, versionName: item.versionName }
      })
      //新加的一条版本信息，没写更新时间的话
      if (!item.time.length) {
        console.warn("该条版本信息没有时间")
        console.log(item)
        timeVersionMap["19991231"] = { version: item.version, versionName: item.versionName }
      }
    })
  },
  /**获取1999版本信息*/
  getVersionInfo: async (checkTime: string, checkVersion?: number) => {
    try {
      const result = await api_getVersionInfo()
      const { code, data, msg } = result

      if (code === 200 && data) {
        const { versionList } = data
        console.log("获取到的版本信息为：", versionList)

        //判断需要检查的时间，服务器的版本信息是否存在于
        let isExist = false
        const newVersionList = versionList.map((item) => {
          if (item.time.includes(Number(checkTime)) || item.version === Number(checkVersion))
            isExist = true
          return {
            version: item.version,
            versionName: item.versionName,
            time: item.time,
          }
        })
        if (isExist) {
          config.versions = newVersionList
          fs.writeFileSync(config_path, JSON.stringify(config, null, 2))
          console.warn("版本信息已更新,请重新启动程序")
          exit(0)
        } else throw new Error("默默的小站版本信息未更新，请等待更新或自行添加版本信息")
      } else throw new Error("获取默默的小站版本信息失败")
    } catch (err) {
      const msg = err instanceof Error && err?.message
      if (msg === "fetch failed") console.error("获取版本信息失败，本次未覆盖本地版本信息:", err)
      else if (msg) console.error(msg + "，本次未覆盖本地版本信息:")
      else console.error("获取版本信息失败，本次未覆盖本地版本信息:", err)
    }
  },
}

//#endregion
export default fun
