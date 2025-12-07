//二级路由模块：download
import express, { Router } from "express"
import { download_routers, download_info_routers, download_status_routers } from "./controller"
import { forceQueryToArray } from "@/middleware/index"

const router: Router = express.Router()

/**路由/download*/
router.get("/", download_routers.get)

/**路由/download*/
router.get("/info", download_info_routers.get)

/**路由/download/status*/
router.get("/status", download_status_routers.get)

//导出路由
export default router
