import express from "express"
import { createProxyMiddleware } from "http-proxy-middleware"
import cors from "cors"
import dotenv from "dotenv"
import fun from "./function.js"
const app = express()
const { checkVersion } = fun

dotenv.config() // 加载环境变量

const port = 3000 //本地服务器端口号
const waitTime = 5000 //单位毫秒

//处理跨域，用CORS中间件
app.use(
  cors({
    origin: "*", // 只允许这个源发起跨源请求
    methods: ["GET", "POST", "PUT", "DELETE"], // 允许的HTTP方法
    allowedHeaders: ["*"], // 允许的请求头
  }),
)

app.use(
  "/download1999",
  createProxyMiddleware({
    target: "https://gamecms-res.sl916.com",
    changeOrigin: true,
    pathRewrite: {
      "/download1999": "", // 去掉前缀
    },
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader("Origin", "https://gamecms-res.sl916.com") // 设置目标Origin
    },
  }),
)

//主路径，验证服务器是否连接成功
app.get("/", async (req, res) => {
  try {
    console.warn("本地代理服务器运行中")
    res.send({ data: { status: 200, msg: "本地代理服务器运行中" } })
  } catch (err) {
    console.log(err)
  }
})

//监听本地服务器端口
app.listen(port, async () => {
  await checkVersion()
  console.log(
    `下载代理地址为： http://127.0.0.1:${port}\n` +
      "请打开：https://muxidream.cn/reverse1999 进行批量下载\n" +
      "如果是exe程序运行，关闭本窗口，即可释放端口\n" +
      "如果是JS脚本运行，Ctrl+C键退出，即可释放端口",
  )
})
