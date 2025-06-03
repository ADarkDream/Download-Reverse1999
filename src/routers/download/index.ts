//二级路由模块：download
import express, { Router } from "express"
import { main_routers, aaa_routers } from "./controller"

const router: Router = express.Router()

/**路由/download*/
router.get("/", main_routers.get)

//导出路由
export default router
