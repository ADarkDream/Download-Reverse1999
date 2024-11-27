const express = require('express');
const {createProxyMiddleware} = require('http-proxy-middleware');
const app = express();
const cors = require('cors')
const re = express.Router()

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

app.use('/',re)
//主路径，验证服务器是否连接成功
re.get('/', async (req, res) => {
    try {
       res.send({data: {status: 200, msg: '代理端口运行中'}})
    } catch (err) {
        console.log(err)
    }
})

//监听本地3000端口
app.listen(3000, () => {
    console.log('下载代理端口为： http://127.0.0.1:3000')
    console.log('请打开：https://muxidream.cn/reverse1999 进行批量下载')
    console.log('如果是exe程序运行，关闭本窗口，即可释放端口')
    console.log('如果是JS脚本运行，Ctrl+C键退出，即可释放端口')
});

