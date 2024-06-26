const request = require("request");
const https = require('https');
const fs = require("fs");
const {pipeline} = require('stream');
const {promisify} = require('util');
const pipelineAsync = promisify(pipeline);
const express = require('express');
const app = express();
const port = 3000; // 您可以使用任何端口
const  probe = require('probe-image-size')

let PCUrlArr = []
let phoneUrlArr = []
let imgArr = []
let errorUrlStr =''


process.env.NODE_NO_WARNINGS = '';//忽略掉fetch的实验性警告，使它不打印到控制台

app.get('/', async (req, res) => {
    try {
        res.send('你好，不用在意这个窗口，请查看文件夹中你需要下载的图片');
    } catch (err) {
        console.log(err)
    }
});

// 启动服务器
app.listen(port, () => {
        console.log(`本脚本运行过程中会占用端口：127.0.0.1: ${port}，关闭脚本即可释放`);
        console.log('---------------------------------------------脚本说明(V1.2.2)-----------------------------------------\r\n')
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
        console.log('\r\n-----------------------------------下面是程序错误输出------------------------------------\r\n')
        console.log('【注意：首次运行可能因为提醒联网权限的问题无法成功下载图片，授权之后关闭程序然后再次运行即可】\r\n')
    }
)

start()

//主函数
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
        if (!fs.existsSync('./urlList')) fs.mkdirSync('./urlList', {recursive: true})

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
                // console.log('正在下载：', newName)  //185 1125x2436.jpg
                //开始下载图片,并对图片分类处理
                await downloadImg(imgUrl, PCDir + newName, phoneDir + newName,newName).catch(error => console.error(`下载失败，图片链接为：${imgUrl}`, error));

                imgArr.push({imgName: newName, imgUrl, imgPath: PCDir + newName})
                return imgUrl
            }))

        console.log('\r\n------------------------------程序运行结束，请查看以下说明-------------------------------\r\n')
        console.log('| 竖屏图片已下载到/image/phoneImg/目录下')
        console.log('| 横屏图片已下载到/image/PCImg/目录下')
        console.log('| 重复的图片只保留一份。')
        const newArray = resArr.filter(item => {
            return item !== undefined
        })

        // fs.writeFileSync('./AllUrl.json', JSON.stringify(imgArr))
        fs.writeFileSync('./urlList/newUrl.txt', newArray.join('\r\n'))
        fs.writeFileSync('./urlList/PCUrlList.json', JSON.stringify(PCUrlArr))
        fs.writeFileSync('./urlList/phoneUrlList.json', JSON.stringify(phoneUrlArr))
        if (errorUrlStr!=='') fs.writeFileSync('./urlList/errorUrl.txt', errorUrlStr)
        console.log('\r\n--  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --\r\n')
        console.log('| 网址筛选成功,共' + newArray.length + '个链接，存放到以下三个文件中（重复的链接不会去除）：')
        console.log('| ./urlList/PCUrlList.json 中存放横屏壁纸链接['+PCUrlArr.length+'个]（JSON格式，可以直接作为网页数据）')
        console.log('| ./urlList/phoneUrlList.json 中存放竖屏壁纸链接['+phoneUrlArr.length+'个]（JSON格式，可以直接作为网页数据）')
        console.log('| ./urlList/newUrl.txt中存放全部壁纸链接（空格隔开,可以复制到其他下载器批量下载）')
        if (errorUrlStr!=='') console.log('| ./urlList/errorUrl.txt中存放可能下载出错的壁纸链接，请自行手动下载，上述JSON文件中不保存下载失败的图片链接')
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


//图片下载函数，只能一张一张下载，下载并分类
async function downloadImg(imgUrl, PCImgPath, phoneImgPath, imgName) {
    try {
        //默认存入PCImg文件夹
        const fileWriter = fs.createWriteStream(PCImgPath);
        const response = await fetch(imgUrl);
        // 检查响应是否成功（状态码在200-299之间）
        if (!response.ok) new Error(`无法获取图片：${response.statusText}`);
        // 确保响应主体可读
        if (!response.body) new Error(`响应主体不可读`);

        //确保文件已写入
        await pipelineAsync(response.body, fileWriter)

        // 确保文件正确写入
        if (fs.statSync(PCImgPath).size === 0) new Error('下载的文件为空(0KB)');

        //检查图片分辨率，并进行分类
         const readStream = fs.createReadStream(PCImgPath);
        const dimensions = await probe(readStream);
        readStream.destroy(); // 关闭流
        // const dimensions = await sharp(PCImgPath).metadata();
        if (dimensions.width > dimensions.height) PCUrlArr.push({imgName, imgUrl, imgPath: PCImgPath})
        else {
            // 移动图片
            fs.rename(PCImgPath, phoneImgPath, err => {
                if (err)  new Error(err.message)
            })
            //将地址写入phoneUrlArr
            phoneUrlArr.push({imgName, imgUrl, imgPath: phoneImgPath})
        }

    } catch (err) {
        console.log('\r\n'+err.message)
        console.log('图片' + imgName + '可能未下载成功，请手动下载：' + imgUrl)
        errorUrlStr+=imgUrl+'\r\n'
    }
}