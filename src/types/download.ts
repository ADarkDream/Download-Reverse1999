/**版本信息*/
export type VersionItem = {
  /** 版本号 */
  version: number
  /** 版本名称 */
  versionName: string
  /** 版本时间(年月日，六位日期数字) */
  time: number[]
}

/**版本信息,key为版本时间，value为版本号和名称*/
export type TimeVersionMap = {
  /** 版本时间(年月日，六位日期数字) */
  [time: string]: {
    /** 版本号 */
    version: number
    /** 版本名称 */
    versionName: string
  }
}

/** 图片链接清洗后的信息 */
export type ImageInfo = {
  /** 图片原名 */
  oldName: string
  /** 图片新命名 */
  newName: string
  /** 图片url */
  imgUrl: string
  /** 图片所属版本号 */
  version: number
  /** 图片所属版本名称 */
  versionName: string
  /** 图片在该版本的序号 */
  index: number
  /** 图片更新时间(年月日，六位日期数字) */
  time: string
  /** 图片类型，0为横屏，1为竖屏 */
  sort: number
  /** 图片实际高度(px) */
  height?: number
  /** 图片实际宽度(px) */
  width?: number
  /** 图片路径 */
  imgPath: string
  /** 图片md5(来自原文件名) */
  md5: string
}

/**config.json*/
export type CONFIG = {
  /**启动模式*/
  mode: "download" | "server"
  /**启动端口*/
  port: number
  /**版本信息*/
  localVersion: string
  /**启动时是否检查更新*/
  isCheckUpdate: boolean
  /**各类询问的倒计时时间*/
  waitTime: number
  /**横屏壁纸存放路径*/
  PCDir: string
  /**竖屏壁纸存放路径*/
  phoneDir: string
  /**清洗出来的各类url存放路径*/
  listPath: string
  /**线程数，最大并发下载数量*/
  maxConcurrent: 3
  /**存放需要下载的图片链接的url.txt文件路径*/
  filePath: string
  /**想要下载的版本，以10作为版本1.0，以此类推*/
  targetVersions: number[]
  /**版本信息*/
  versions: VersionItem[]
}
