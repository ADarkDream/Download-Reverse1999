import { createProxyMiddleware, Options } from "http-proxy-middleware"
import { Request, Response } from "express"
import type { ClientRequest } from "http"

// 定义代理配置的类型
const options: Options = {
  target: "https://gamecms-res.sl916.com",
  changeOrigin: true,
  pathRewrite: {
    "^/download1999": "", // 注意这里需要写成正则字符串的形式
  },
  // @ts-ignore
  onProxyReq: (proxyReq: ClientRequest, req: Request, res: Response) => {
    proxyReq.setHeader("Origin", "https://gamecms-res.sl916.com")
  },
}

/** 1999以影像之反向代理
 * - https://gamecms-res.sl916.com
 * - 改写为 http://{BASE_URL}:{BASE_PORT}/download1999
 */
export const reverse1999Proxy = createProxyMiddleware(options)
