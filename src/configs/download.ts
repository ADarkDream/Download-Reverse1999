import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"
dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` })
import { CONFIG } from "@/types/download"
import { api_getVersionInfo } from "@/apis/download/update"

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)

/**本次下载状态*/
export const download_status = {
  /**0:未开始下载 1:下载中 2:下载完成,正在处理,3:处理结束，4:下载失败*/
  type: 0,
  /**总下载数量*/
  total: 0,
}

/**默认下载器配置*/
export const config: CONFIG = {
  mode: "server",
  port: 1999,
  localVersion: "1.4.2",
  isCheckUpdate: true,
  waitTime: 5000,
  PCDir: "./image/PCImg/",
  phoneDir: "./image/phoneImg/",
  listPath: "./urlList/",
  maxConcurrent: 3,
  filePath: "./url.txt",
  targetVersions: [],
  versions: [
    {
      version: 10,
      versionName: "V1.0_公测及之前",
      time: [20230325, 20230328],
    },
    {
      version: 11,
      versionName: "V1.1_雷米特杯失窃案",
      time: [20230712],
    },
    {
      version: 12,
      versionName: "V1.2_绿湖噩梦",
      time: [20230823],
    },
    {
      version: 13,
      versionName: "V1.3_行至摩卢旁卡",
      time: [20231003, 20231031],
    },
    {
      version: 14,
      versionName: "V1.4_洞穴的囚徒",
      time: [20231114],
    },
    {
      version: 15,
      versionName: "V1.5_复兴！乌卢鲁运动会",
      time: [20231226],
    },
    {
      version: 16,
      versionName: "V1.6_朔日手记",
      time: [20240205],
    },
    {
      version: 17,
      versionName: "V1.7_今夜星光灿烂",
      time: [20240327],
    },
    {
      version: 18,
      versionName: "V1.8_再见，来亚什基",
      time: [20240501],
    },
    {
      version: 19,
      versionName: "V1.9_孤独之歌",
      time: [20240612],
    },
    {
      version: 20,
      versionName: "V2.0_飞驰！明日之城",
      time: [20240723],
    },
    {
      version: 21,
      versionName: "V2.1_77号往事",
      time: [20240902],
    },
    {
      version: 22,
      versionName: "V2.2_忧郁的热带",
      time: [20241015],
    },
    {
      version: 23,
      versionName: "V2.3_圣火纪行：东区黎明",
      time: [20241126],
    },
    {
      version: 24,
      versionName: "V2.4_地球上最后的夜晚",
      time: [20250101],
    },
    {
      version: 25,
      versionName: "V2.5_唐人街影话",
      time: [20250211],
    },
    {
      version: 26,
      versionName: "V2.6_疯癫与文明",
      time: [20250325],
    },
    {
      version: 27,
      versionName: "V2.7_1987宇宙组曲",
      time: [20250501, 20250507],
    },
    {
      version: 28,
      versionName: "V2.8_复乐园",
      time: [20250610],
    },
    {
      version: 30,
      versionName: "V3.0_行于漫漫长路上",
      time: [20250722],
    },
    {
      version: 30.5,
      versionName: "V3.0.5_翡冷翠之春；入雅典记",
      time: [20250902],
    },
    {
      version: 31,
      versionName: "V3.1_长夜鸣笛",
      time: [20251015],
    },
    {
      version: 32,
      versionName: "V3.2_迁流的盛宴",
      time: [20251125],
    },
    {
      version: 33,
      versionName: "V3.3_远征记",
      time: [20260106],
    },
    {
      version: 34,
      versionName: "V3.4_不老春",
      time: [20260218],
    },
    {
      version: 35,
      versionName: "V3.5_《绿松石蛇俱乐部》",
      time: [20260330],
    },
    {
      version: 36,
      versionName: "V3.6_人们向何处去",
      time: [20260413],
    },
    {
      version: 37,
      versionName: "V3.7_他者的悲哀",
      time: [20260530],
    },
    {
      version: 38,
      versionName: "V3.8_世纪末尺度",
      time: [20260708],
    },
    {
      version: 38.5,
      versionName: "V3.8.5_聚合浪潮",
      time: [20260729],
    },
    {
      version: 39,
      versionName: "V3.9_重燃！流金之海",
      time: [20260907],
    },
  ],
}

/**重置下载状态*/
export const resetDownloadStatus = () => {
  download_status.type = 0
  download_status.total = 0
}

/**获取本地配置文件config.json*/
export const getLocalConfig = async (): Promise<CONFIG> => {
  const isDev = process.env.NODE_ENV === "development"
  // 检查config.json是否存在，如果不存在则退出
  const config_path = isDev ? "./src/configs/config.json" : "./config.json"

  if (!fs.existsSync(config_path)) {
    console.error("|配置文件config.json不存在，需要config.json文件置于当前目录下才可运行")
    console.warn("|将在当前目录下生成默认配置文件config.json")
    fs.writeFileSync(config_path, JSON.stringify(config, null, 2))
    console.warn("|默认配置文件config.json生成成功,可参考配置说明：")
  }
  console.log(
    "\n|本项目仓库地址：https://gitee.com/MuXi-Dream/download-reverse1999 \n|可退出程序，修改配置文件后再次启动程序\n",
  )
  return JSON.parse(fs.readFileSync(config_path, "utf-8"))
}

/**读取本地配置并覆盖默认配置*/
const combinedConfig = async () => {
  try {
    const localConfig = await getLocalConfig()
    if (!localConfig) {
      console.warn("|未读取到本地配置,使用默认配置。")
      return
    }
    // 获取云端版本信息，并合并
    try {
      const versionList = await api_getVersionInfo()
      if (!versionList.length) throw new Error("获取版本信息失败")
      // Object.assign(config, { versions: versionList || [] })
      console.log("|获取云端版本信息成功")
      const newVersions = versionList.map((item) => ({
        version: item.version,
        versionName: item.versionName,
        time: item.time,
      }))

      console.log("config", config)

      console.log("newVersions", newVersions)

      // console.log(JSON.stringify(versionList))
      const newConfig = mergeVersions(config, { versions: newVersions } as CONFIG)
      console.log("aaa", newVersions)
      console.log("ttt", newConfig)
      Object.assign(config, newConfig)
    } catch (e) {
      console.error("|获取云端版本信息失败", e)
    }
    // console.log("ttt", localConfig)

    const newConfig = mergeVersions(config, localConfig)
    Object.assign(config, newConfig)
    console.log("|合并默认/云端/本地数据之后,配置信息如下:\n", JSON.stringify(config))
  } catch (e) {
    console.error("|读取本地配置失败,请检查配置文件后再启动程序。", e)
  }
}

combinedConfig()

function mergeVersions(localA: CONFIG, cloudB: CONFIG) {
  // 创建版本映射表，优先使用localA的版本
  const versionMap = new Map()

  // 先添加localA的所有版本
  localA.versions.forEach((item) => {
    versionMap.set(item.version, {
      version: item.version,
      versionName: item.versionName,
      time: [...item.time], // 创建time数组的副本
    })
  })

  // 然后添加cloudB的版本，不覆盖已存在的版本
  cloudB.versions.forEach((item) => {
    if (!versionMap.has(item.version)) {
      versionMap.set(item.version, {
        version: item.version,
        versionName: item.versionName,
        time: [...item.time], // 创建time数组的副本
      })
    }
  })

  // 合并后的结果对象
  const merged = {
    ...localA, // 保留localA的其他配置
    ...cloudB,
    versions: Array.from(versionMap.values()).sort((a, b) => a.version - b.version), // 按version排序
  }

  return merged
}
