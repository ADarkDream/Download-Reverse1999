//请注意：修改本文件需要使用英文符号，详细说明请看readme.md
const config = {
    //本地服务器端口号,您可以使用绝大部分端口
    port: 3000,

    //横屏图片存储路径
    PCDir: './image/PCImg/',

    //竖屏图片存储路径
    phoneDir: './image/phoneImg/',

    //链接文件存放路径
    listPath: './urlList/',

    //图片下载失败之后的最大重试下载次数
    cycle: 3,

    //下载方式有以下两种，当方式一文件不存在时自动尝试方式二
    /*下载方式一：自行指定下载链接
      1999图片链接的txt文件路径
    */
    filePath: "./url.txt",

    /*下载方式二：使用深蓝官方接口
      目标版本号
      */
    targetVersions: [],

    //图片版本信息(需要自行添加)，不匹配的默认为1999版本
    versions: [
        {
            time: [20230325, 20230328],
            version: 10,
            versionName: "V1.0_公测及之前"
        },
        {
            time: [20230712],
            version: 11,
            versionName: "V1.1_雷米特杯失窃案"
        },
        {
            time: [20230823],
            version: 12,
            versionName: "V1.2_绿湖噩梦"
        },
        {
            time: [20231003, 20231031],
            version: 13,
            versionName: "V1.3_行至摩卢旁卡"
        },
        {
            time: [20231114],
            version: 14,
            versionName: "V1.4_洞穴的囚徒"
        },
        {
            time: [20231226],
            version: 15,
            versionName: "V1.5_乌卢鲁运动会"
        },
        {
            time: [20240205],
            version: 16,
            versionName: "V1.6_朔日手记"
        },
        {
            time: [20240327],
            version: 17,
            versionName: "V1.7_今夜星光灿烂"
        },
        {
            time: [20240501],
            version: 18,
            versionName: "V1.8_再见，来亚什基"
        },
        {
            time: [20240612],
            version: 19,
            versionName: "V1.9_孤独之歌"
        },
        {
            time: [20240723],
            version: 20,
            versionName: "V2.0_飞驰明日之城"
        },
        {
            time: [20240902],
            version: 21,
            versionName: "V2.1_77号往事"
        },
        {
            time: [20241015],
            version: 22,
            versionName: "V2.2_忧郁的热带"
        },
        {
            time: [20241126],
            version: 23,
            versionName: "V2.3_圣火纪行：东区黎明"
        }
    ]
}

module.exports = config