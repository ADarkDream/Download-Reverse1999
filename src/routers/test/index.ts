//二级路由模块：test
import express, { Router } from "express"
import { main_routers, aaa_routers } from "./controller"

const router: Router = express.Router()

/**示例/test*/
router.get("/", main_routers.get)

/**示例/test/aaa*/
router.get("/aaa", aaa_routers.post)

//导出路由
export default router
