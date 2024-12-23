const express = require('express')
const app = express()
const { createProxyMiddleware } = require('http-proxy-middleware')
const cors = require('cors')
const fs = require('fs')

// 检查config.json是否存在，如果不存在则退出
const config_path = './config.json'
if (!fs.existsSync(config_path)) {
    app.listen(3000, async () => {
        console.error('配置文件config.json不存在，请将config.json文件放在当前目录下')
    })
    return
}
const config = JSON.parse(fs.readFileSync(config_path, 'utf-8'))

//在代理模式时会自动切换为3000端口，因为网站检测的是3000端口，暂未支持自定义端口
const port = config?.mode === 'server' ? 3000 : (config?.port || 3000)
const mode = config?.mode || "download"

const { start, checkVersion } = require('./function')


//#region 代理端口

//处理跨域，用CORS中间件
app.use(cors({
    origin: '*', // 只允许这个源发起跨源请求
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // 允许的HTTP方法
    allowedHeaders: ['*'], // 允许的请求头
}))

app.use('/download1999', createProxyMiddleware({
    target: 'https://gamecms-res.sl916.com',
    changeOrigin: true,
    pathRewrite: {
        '/download1999': '', // 去掉前缀
    },
    onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('Origin', 'https://gamecms-res.sl916.com') // 设置目标Origin
    },
}))

//主路径，验证服务器是否连接成功
app.get('/', async (req, res) => {
    try {
        console.warn('本地代理服务器运行中');
        res.send({ data: { status: 200, msg: '本地代理服务器运行中' } })
    } catch (err) {
        console.log(err)
    }
})
//#endregion



// 启动服务器
app.listen(port, async () => {
    console.log(`---------------------------------------------脚本说明(${config.localVersion})---------------------------------------------\n`)
    console.warn(`【本脚本运行过程中会占用端口：127.0.0.1: ${port}，关闭脚本即可释放】`)
    console.error('【注意：首次运行可能因为提醒联网权限的问题无法成功下载图片，授权之后关闭程序然后再次运行即可】\n' +
        '| 本脚本程序仅用于批量下载1999国服官网的图片，仅作为技术分享，请勿用于其他用途。若侵权请联系删除。】')
    console.log('| 项目地址：\n' +
        ' [Gitee@默默](https://gitee.com/MuXi-Dream/download-reverse1999) ；\n' +
        ' [GitHub@默默](https://github.com/ADarkDream/Download-Reverse1999)  \n' +
        ' [API文档](https://apifox.com/apidoc/auth-shared-70082832-e502-49ac-a386-35af15bfd747?redirect=%2Fshared-70082832-e502-49ac-a386-35af15bfd747%2Fapi-186774719&&type=shareDoc)API文档主要是壁纸链接表及角色信息表，用于给图片分类，见下方[默默的小站]。如有需要API文档可找我要密码')
    console.warn('| 为方便使用，已将本项目功能上线，可前往[默默的小站](https://muxidream.cn/reverse1999)分类筛选并下载')
    console.log('| 其它联系方式：[微博@玖优梦](https://weibo.com/u/6869134755)（微博私信我会自动回复链接）\n' +
        '| 百度网盘链接：[重返未来1999](https://pan.baidu.com/s/1A4o9VM4kPa_vzWZEtHiZSA?pwd=1999)\n' +
        '| 预防网盘链接失效，可以保存：[1999资源总表：金山云文档](https://kdocs.cn/l/cjkqngyqWLTI)\n')

    //检查下载器版本
    await checkVersion()
    console.log('\n---------------------------------------------下面是程序输出---------------------------------------------\n')

    //主函数
    if (mode === 'download') {
        console.warn('当前是下载模式');
        start()
    } else {
        console.warn('当前是代理模式')
        console.log(`下载代理端口为： http://127.0.0.1:${port}\n` +
            '请打开：https://muxidream.cn/reverse1999 进行批量下载\n' +
            '如果是exe程序运行，关闭本窗口，即可释放端口\n' +
            '如果是JS脚本运行，Ctrl+C键退出，即可释放端口')
    }
})