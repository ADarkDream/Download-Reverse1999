// src/app.ts
import dotenv from "dotenv" //环境变量的库
dotenv.config({ path: `./.env.${process.env.NODE_ENV || "development"}` })
import express from "express"
import cors from "cors"
import { send, errorHandler } from "@/middleware/index"
import { reverse1999Proxy } from "@/proxy/index"
import config from "@/configs/config.js"
import type { Request, Response, NextFunction } from "express"
//* 导入全部路由文件
import routers from "@/routers/index"

/**服务器监听端口*/
const BASE_PORT = config.BASE_PORT || process.env.BASE_PORT || 3000
/**服务器本地地址*/
const BASE_URL = config.BASE_URL || process.env.BASE_URL || "http://127.0.0.1"

const app = express()

//有代理服务器，需要开启这个选项,获取访问者真实IP
app.set("trust proxy", true)

//处理跨域，用CORS中间件
app.use(
  cors({
    origin: "*", // 只允许这个源发起跨源请求
    methods: ["GET", "POST", "PUT", "DELETE"], // 允许的HTTP方法
    allowedHeaders: ["Content-Type", "Authorization"], // 允许的请求头
  }),
)

//转换客户端提交的json格式的数据
app.use(express.json())

//转换客户端提交的urlencoded（表单）格式的数据
app.use(express.urlencoded({ extended: true }))

//静态资源中间件,允许访问static目录下的文件
app.use("/favicon.ico", express.static("static/favicon.ico"))
app.use("/img", express.static("static/images"))
// app.use("/upload", express.static("static/uploads"))

//全局中间件，精简res.send()
app.use(send as (req: Request, res: Response, next: NextFunction) => void)

// 1999以影像之反向代理
app.use("/download1999", reverse1999Proxy)

//路由模块，导入全部路由
app.use("/", routers)

//路由错误捕获中间件
app.use(errorHandler as (err: Error, req: Request, res: Response, next: NextFunction) => void)

//启动服务器
app.listen(BASE_PORT, () => {
  console.warn(`|当前环境是：${process.env.Node_ENV} 模式`)
  console.warn(`|服务器已启动，正在监听 ${BASE_URL}:${BASE_PORT}`)
})

//全局捕获未处理的异常，防止崩溃
process.on("unhandledRejection", (err, promise) => {
  console.error("|🚨 异步未处理的异常：", err instanceof Error && err.message)
  console.error(err)
})

process.on("uncaughtException", (err) => {
  console.error("|💥 同步未捕获异常：", err.message)
  console.error(err)
})
