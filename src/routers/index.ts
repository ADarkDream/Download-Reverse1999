//一级路由模块(主路由)
import express, { Router } from "express"
import { router_success, router_error } from "./controller"
//导入子路由(二级路由)
import test from "./test/index"

const router: Router = express.Router()

//默认路由，调用处理函数
router.get("/", router_success)

//#region 一级路由
/**
 * test相关的路由模块
 * 为其添加一级路由/test
 * */
router.use("/test", test)

//* 这里添加一级路由

//#endregion

//找不到该页面时返回404
router.use("/", router_error)

//导出路由
export default router
