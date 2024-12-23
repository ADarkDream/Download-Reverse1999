const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')
const app = express()
const cors = require('cors')
require('dotenv').config();

const port = 3000 //本地服务器端口号
const waitTime = 5000 //单位毫秒


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

//监听本地服务器端口
app.listen(port, async () => {
    await checkVersion()
    console.log(`下载代理端口为： http://127.0.0.1:${port}\n` +
        '请打开：https://muxidream.cn/reverse1999 进行批量下载\n' +
        '如果是exe程序运行，关闭本窗口，即可释放端口\n' +
        '如果是JS脚本运行，Ctrl+C键退出，即可释放端口')
})

//检查版本号
const checkVersion = async () => {
    try {
        const response = await fetch(process.env.BASE_URL || 'https://muxidream.cn/api/getLatestVersion')
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const result = await response.json()
        const { status, msg, data } = result
        if (status === 400 && msg) return console.error(msg);
        else if (status !== 200) return console.error('未知错误，检查版本号失败');
        const { server_version, update_url } = data

        const name = '下载代理'
        const version = '1.0.1'
        const latestVersion = server_version
        const isLatest = version === latestVersion

        if (!isLatest) {
            const time = (waitTime / 1000).toFixed(0) || 0
            console.warn('检查到更新版本\n' +
                `当前${name}版本为：${version},最新${name}版本为：${latestVersion}\n` +
                `如需更新请前往:${update_url} 下载最新版本\n` +
                `${time}秒后开始执行主函数`)
            await new Promise(resolve => setTimeout(resolve, waitTime))
        } else console.log(`当前${name}版本为：${version},当前已是最新版本\n`)
    } catch (error) {
        console.error('检查版本号失败', error);
    }
}