const request = require("request");
const fs = require("fs");

const https = require('https');
// const fetch = require('node-fetch');
const {pipeline} = require('stream');
const {promisify} = require('util');
const pipelineAsync = promisify(pipeline);

const express = require('express');
const app = express();
const port = 3000; // 您可以使用任何端口

process.env.NODE_NO_WARNINGS = '1';//忽略掉fetch的实验性警告，使它不打印到控制台

app.get('/', async (req, res) => {
    try {
        res.send('你好，不用在意这个窗口，请查看文件夹中你需要下载的图片');
    } catch (err) {
        console.log(err)
    }
});

// 启动服务器
app.listen(port, () => {
        // console.log(`请打开这个网址：127.0.0.1: ${port}`);
        console.log('---------------------------------------------脚本说明-----------------------------------------\r\n')
        console.log('| 本脚本程序仅用于批量下载1999国服官网的图片，仅作为技术分享，请勿用于其他用途。侵权请联系删除。\n' +
            '\n' +
            '| 联系方式： [微博@玖优梦]（微博私信我会自动回复以下链接）\n' +
            '\n' +
            '| 如果你嫌麻烦，我有已整理好的绝大多数官方国服和国际服的图片资源：\n' +
            '\n' +
            '| [百度网盘链接](https://pan.baidu.com/s/1A4o9VM4kPa_vzWZEtHiZSA?pwd=1999)\n' +
            '\n' +
            '| 文件夹分类说明请见微博专栏第七篇文章：[微博@玖优梦的专栏文章](https://weibo.com/ttarticle/x/m/show#/id=2309404942430960222221&_wb_client_=1)\n' +
            '| 预防网盘链接失效，可以保存：[1999资源总表：金山云文档](https://kdocs.cn/l/cjkqngyqWLTI)')
        console.log('\r\n-----------------------------------下面是程序输出(可忽略)------------------------------------\r\n')
        console.log('【注意：首次运行可能因为联网权限问题无法成功下载图片，授权之后关闭程序程序再次运行即可】\r\n')
    }
)

start()

async function start() {
    try {
        //判断是否存在url.txt文件
        if (!fs.existsSync('url.txt')) {
            console.log('\r\n---------------------------------------程序出错---------------------------------------------\r\n')
            console.log('没有找到url.txt文件，使用本脚本程序前请先阅读使用说明')
            console.log('\r\n--------------------------------------已停止运行----------------------------------------\r\n')
            return
        }
        //从url.txt文件中读取数据，并分割字符串
        const data = fs.readFileSync("./url.txt").toString().split('src=')
        //定义图片存储文件夹
        const PCDir = './image/PCImg/'
        const phoneDir = './image/phoneImg/'
        // 检查目标文件夹是否存在，如果不存在则创建
        if (!fs.existsSync(PCDir)) fs.mkdirSync(PCDir, {recursive: true})
        if (!fs.existsSync(phoneDir)) fs.mkdirSync(phoneDir, {recursive: true})

        //因为map和forEach中不能直接使用await函数，所以得在外面加一层Promise.all
        const resArr = await Promise.all(
            //遍历
            data.map(async (item) => {
                //将url提取出来
                const imgUrl = await getUrl(item)
                if (imgUrl === null) return
                const strList = imgUrl.split('/')
                const fileName = strList[strList.length - 1]   //例如：185%201125x2436_16e74393815d4aacbbbbb60c8f106de0.jpg
                let [name, halfName] = fileName.split('_')
                let newName = ''
                if (halfName !== undefined) {
                    //分割_符号左右部分, 获取文件后缀名
                    let [hash, format] = halfName.split('\.')
                    newName = (name + '.' + format).replace(/%20/g, " ") //拼接新名称并替换%20为空格
                }
                // console.log('newName', newName)  //185 1125x2436.jpg
                //判断是竖屏图还是横屏图，开始下载
                if (newName.includes('1125')) await downloadImg(imgUrl, phoneDir + newName).catch(error => console.error(`下载失败，图片链接为：${imgUrl}`, error)); //竖屏图
                if (newName.includes('2560')) await downloadImg(imgUrl, PCDir + newName).catch(error => console.error(`下载失败，图片链接为：${imgUrl}`, error)); //横屏图
                return imgUrl
            }))

        console.log('\r\n------------------------------程序运行结束，请查看以下说明-------------------------------\r\n')
        console.log('| 竖屏图片已下载到/image/phoneImg/目录下')
        console.log('| 横屏图片已下载到/image/PCImg/目录下')
        console.log('| 重复的图片只保留一份。')
        const newArray = resArr.slice(1)
        const pcUrlListStr = newArray.filter(item => {
            if (item !== undefined) return item.includes('2560')
        }).map(item => "'" + item + "',").join('\r\n')
        const phoneUrlListStr = newArray.filter(item => {
            if (item !== undefined) return item.includes('1125')
        }).map(item => "'" + item + "',").join('\r\n')

        fs.writeFileSync('./pcUrlList.txt', "[\r\n" + pcUrlListStr + "\r\n]")
        fs.writeFileSync('./phoneUrlList.txt', "[\r\n" + phoneUrlListStr + "\r\n]")
        fs.writeFileSync('./newUrl.txt', newArray.join('\r\n'))
        console.log('\r\n--  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --\r\n')
        console.log('| 网址筛选成功,链接存放到以下三个文件中（重复的链接不会去除）：')
        console.log('| pcUrlList.txt 中存放横屏壁纸链接（数组格式，可以直接作为网页数据）')
        console.log('| phoneUrlList.txt 中存放竖屏壁纸链接（数组格式，可以直接作为网页数据）')
        console.log('| newUrl.txt中存放全部壁纸链接（空格隔开,可以复制到其他下载器批量下载）')
        console.log('深蓝壁纸图片命名有问题，所以有几张横屏图和竖屏图的url和文件分类可能有问题，现在还需要自己手动改一下，等之后有空了再解决.')
        console.log('\r\n----------------------------------------------------------------------------------------------\r\n')
    } catch (err) {
        console.log(err)
    }
}


//数据清洗方法
async function getUrl(str) {
//设定正则匹配规则
    const reg = /(https?|http|ftp|file):\/\/.*\.jpg/g;//这个规则刚好满足匹配1999官网的图片命名
//替换网址间的空格获取网址
    str = str.replace(/\s/g, "%20")
    str = str.match(reg)
    if (str && str.length > 0) return str[0];
    else return null;
}


//图片下载函数第一版：需要限制同时进行的下载请求数量，nodejs下载请求过多会闪退
/*
async function downImg(url, imgPath) {
    return ()=>new Promise((resolve, reject) => {
        request
            .get(url)//options{}对象
            .on('response', (response) => {
                console.log("下载的图片类型为：", response.headers['content-type'])
            })
            .pipe(fs.createWriteStream(imgPath))
            .on("error", (e) => {
                console.log("下载错误", e)
                resolve('');
            })
            .on("finish", () => {
                resolve("下载成功");
            })
            .on("close", () => {
                // console.log("下载模块关闭");
            })
    })
}
*/

//图片下载函数第二版，只能一张一张下载
async function downloadImg(url, imgPath) {
    const fileWriter = fs.createWriteStream(imgPath);
    const response = await fetch(url);
    await pipelineAsync(response.body, fileWriter);
    console.log(`下载成功,已存入${imgPath}`);
}

//图片下载函数第三版，待修改。现将图片链接分类，再传入下面的函数批量下载
/*
downloadImages函数将[urls数组]切割为多个chunk，并逐个执行每个chunk的下载任务，
每个chunk中同时下载的任务数量受concurrencyLimit参数控制。

async function downloadImages(urls, outputPath, concurrencyLimit) {
    const chunks = [];
    while (urls.length) {
        chunks.push(urls.splice(0, concurrencyLimit));
    }

    for (const chunk of chunks) {
        await Promise.all(chunk.map(url => downloadImage(url, outputPath)));
    }

    console.log('所有图片下载完成');
}

async function downloadImage(url, outputPath) {
    const response = await fetch(url);
    const fileWriter = fs.createWriteStream(path.join(outputPath, path.basename(url)));
    await pipelineAsync(response.body, fileWriter);
    console.log(`${url} 下载完成`);
}
*/