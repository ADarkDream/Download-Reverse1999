/**处理时间戳,返回毫秒级(13位)时间戳*/
function formatTimestamp(timestamp: string | number): number {
  let isNumber = false
  if (typeof timestamp === "number") {
    timestamp = timestamp.toString()
    isNumber = true
  }
  //如果是ISO时间戳
  if (
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(timestamp) ||
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(timestamp)
  ) {
    return new Date(timestamp).getTime()
  }
  //时间戳若不是13位  补全为13位
  else if (isNumber && timestamp.length < 13) {
    for (let i = timestamp.length; i < 13; i++) {
      timestamp += "0"
    }
    return Number(timestamp)
  } else return Number(timestamp)
}

/**获取两个时间戳的插值(正常返回正负数)*/
export function getDiffTimestamp(timestampVal: string | number): number {
  const timestamp = formatTimestamp(timestampVal) //处理时间戳,返回毫秒级(13位)时间戳
  const now = new Date().getTime()
  return now - timestamp
}

/**日期比较函数，返回距今时间*/
export function getDiffTime(timestampVal: string | number): string {
  const timestamp = formatTimestamp(timestampVal) //处理时间戳,返回毫秒级(13位)时间戳

  const minute = 1000 * 60,
    hour = minute * 60,
    day = hour * 24,
    week = day * 7,
    now = new Date().getTime(),
    year = new Date().getFullYear(), // 获取当前时间年份
    createYear = new Date(timestamp).getFullYear() // 获取指定时间戳年份

  let isFuture = false, //判断是否是未来的时间戳
    diffValue = now - timestamp, // 获取时间戳差值
    yearsDiff = year - createYear // 获取年份差
  if (now < timestamp) {
    isFuture = true
    diffValue = timestamp - now
    yearsDiff = createYear - year
  }
  // 如果本地时间反而小于变量时间
  if (diffValue < 0) return "刚刚"

  // 计算差异时间的量级
  const weekC = diffValue / week, // 相对于7天
    dayC = diffValue / day, // 相对于24小时
    hourC = diffValue / hour, // 相对于1小时
    minC = diffValue / minute // 相对于1分钟

  // 使用
  if (minC < 5) {
    return isFuture ? "5分钟内" : "刚刚" //五分钟内
  } else if (minC < 59) {
    return Math.ceil(minC) + (isFuture ? "分钟后" : "分钟前") //一小时内
  } else if (hourC < 23) {
    return Math.ceil(hourC) + (isFuture ? "小时后" : "小时前") //一天内
  } else if (weekC < 1) {
    return Math.ceil(dayC) + (isFuture ? "天后" : "天前") //一周内
  } else {
    //大于一周
    const date = new Date(timestamp)
    if (yearsDiff < 1) {
      //一年内,显示月日
      return date.getMonth() + 1 + "月" + date.getDate() + "日"
    } else {
      //大于一年，显示年份
      return date.getFullYear() + "年" + (date.getMonth() + 1) + "月" + date.getDate() + "日"
    }
  }
}

/**数字小于10则补0*/
function addZero(value: number) {
  if (value < 10) return "0" + value
  return value.toString()
}

export //需要一个时间戳,否则默认给出当前时间
function getTime(timestamp = Date.now()) {
  const d = new Date(timestamp)
  const month = addZero(d.getMonth() + 1)
  const day = addZero(d.getDate())
  const date = d.getFullYear() - 2000 + "/" + month + "/" + day
  const hour = addZero(d.getHours())
  const minute = addZero(d.getMinutes())
  // let ss = d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds()
  // let time = date + ' ' + hour + ':' + minute + ':' + ss
  // if (hour.)
  return date + " " + hour + ":" + minute
}
