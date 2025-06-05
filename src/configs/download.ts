import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"
dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` })
import { CONFIG } from "@/types/download"

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)

/**本次下载状态*/
export const download_status = {
  /**0:未开始下载 1:下载中 2:下载完成,3:下载结束，4:下载失败*/
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
      versionName: "V1.5_乌卢鲁运动会",
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
      versionName: "V2.0_飞驰明日之城",
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
    console.warn(
      "|默认配置文件config.json生成成功，可参考配置说明：\n|本项目仓库地址：https://gitee.com/MuXi-Dream/download-reverse1999#%E4%BD%BF%E7%94%A8%E6%95%99%E7%A8%8B",
    )
    console.log("\n|可退出程序，修改配置文件后再次启动程序\n")
  }

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
    Object.assign(config, localConfig)
    // console.log("|配置信息如下:\n", config)
  } catch (e) {
    console.error("|读取本地配置失败,请检查配置文件后再启动程序。", e)
  }
}

combinedConfig()
