export default {
  /**
   * 后端地址
   */
  BASE_URL: "http://127.0.0.1",
  /**
   * 端口
   */
  BASE_PORT: 9000, //后端主进程端口
  SOCKET_PORT: 9999, //后端socket端口
  /**
   * 七牛云配置
   */
  QINIU: {
    BASE_URL: "", //七牛云存储基地址
    VITE_QINIUTHUMBNAIL_URL: "", //七牛云缩略图存储地址
    accessKey: "",
    secretKey: "",
  },
  /**
   * 阿里云配置
   */
  ALI: {
    ACCESS_KEY_ID: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID || "",
    ACCESS_KEY_SECRET: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET || "",
  },
  /**
   * 百度开发者配置
   */
  BAIDU: {
    ACCESS_KEY_ID: "",
    ACCESS_KEY_SECRET: "",
  },
  QQ: {
    /**
     * QQ 应用验证参数
     */
    options_qq: {
      appId: "",
      redirectURI: "",
    },
    /**
     * QQ 邮箱(默默的小站后台邮箱)
     */
    email: {
      host: "smtp.qq.com", //qq smtp服务器地址
      secureConnection: true, //是否使用安全连接，对https协议的
      port: 465, //qq邮件服务所占用的端口
      auth: {
        user: "", //用户名
        pass: "", // SMTP授权码
      },
    },
  },
  /**
   * 网易云
   * */
  NETEASE: {
    /**
     * 网易云音乐用户cookie认证信息
     */
    music_u: "",
  },
  BASE_HEAD_IMG:
    "https://qiniuthumbnail.muxidream.cn/images/hutao_%E7%B1%B3%E6%B8%B8%E7%A4%BE%E7%94%BB%E5%B8%88Love715.png",
}
