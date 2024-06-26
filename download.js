const request = require("request");
const https = require('https');
const fs = require("fs");
const {pipeline} = require('stream');
const {promisify} = require('util');
const pipelineAsync = promisify(pipeline);
const express = require('express');
const app = express();
const port = 3000; // 您可以使用任何端口
const probe = require('probe-image-size')


let errorUrlStr = ''
let errorArr = []

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
        let allArr = await Promise.all(
            //遍历data
            data.map(async (item) => {
                //清洗数据，获取网址信息
                const imgInfo = await getImgInfo(item)
                if (imgInfo === undefined) return
                imgInfo.imgPath = PCDir + imgInfo.newName
                imgInfo.sort = 0    //0为横屏壁纸

                // console.log('正在下载：', imgInfo.newName)  //185 1125x2436.jpg
                //开始下载图片,并对图片分类处理
                await downloadImg(phoneDir, imgInfo).catch(error => console.error(`下载失败，图片链接为：${imgInfo.imgUrl}`, error));
                return imgInfo
            }))
        console.log('\r\n------------------------------------请查看以下说明-------------------------------------\r\n')
        console.log('| 竖屏图片已下载到/image/phoneImg/目录下')
        console.log('| 横屏图片已下载到/image/PCImg/目录下')
        console.log('| 重复的图片只保留一份。')


        //排序：根据官方上传时间(版本时间)和图片命名序号排序
        allArr.sort((a, b) => {
            const timeA = a.time
            const timeB = b.time
            const indexA = parseInt(a.index, 10)
            const indexB = parseInt(b.index, 10)
            if (timeA === timeB) return indexA - indexB;
            else return timeA - timeB
        })

        //清洗： 清洗空的数据,必须赋给新数组
       const resArr= allArr.filter(item => {
            return item !== undefined
        })
        //分类：分类导出
        const allUrl = []
        const PCUrlArr = []
        const phoneUrlArr = []
        resArr.forEach(item => {
            allUrl.push(item.imgUrl)    //链接数组
            if (item.sort === 0) PCUrlArr.push(item)    //横屏
            else phoneUrlArr.push(item)     //竖屏
        })

        fs.writeFileSync('./urlList/allUrl.json', JSON.stringify(resArr))
        fs.writeFileSync('./urlList/allUrl.txt', allUrl.join('\r\n'))
        fs.writeFileSync('./urlList/PCUrlList.json', JSON.stringify(PCUrlArr))
        fs.writeFileSync('./urlList/phoneUrlList.json', JSON.stringify(phoneUrlArr))
        console.log('\r\n--  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --\r\n')
        console.log('| 网址筛选成功,共' + allUrl.length + '个链接，存放到以下文件中（重复的链接不会去除）：')
        console.log('| ./urlList/allUrlList.json 中存放全部壁纸信息[' + resArr.length + '条]（JSON格式，可以直接作为网页数据）')
        console.log('| ./urlList/PCUrlList.json 中存放横屏壁纸信息[' + PCUrlArr.length + '条]（JSON格式，可以直接作为网页数据）')
        console.log('| ./urlList/phoneUrlList.json 中存放竖屏壁纸信息[' + phoneUrlArr.length + '条]（JSON格式，可以直接作为网页数据）')
        console.log('| ./urlList/allUrl.txt中存放全部壁纸链接（空格隔开,可以复制到其他下载器批量下载）')
        if (errorUrlStr !== '') {
            fs.writeFileSync('./urlList/errorUrl.txt', errorUrlStr)
            fs.writeFileSync('./urlList/errorUrlList.json', JSON.stringify(errorArr))
            console.log('\r\n| 上述JSON文件中包含下载失败的图片信息，如果信息和分类有误可以手动修改')
            console.log('| ./urlList/errorUrl.txt中存放可能下载出错的壁纸链接，请自行手动下载')
            console.log('| ./urlList/errorUrl.json中存放可能下载出错的壁纸信息[' + errorArr.length + '条]（JSON格式，可以直接作为网页数据）')
        }
        console.log('\r\n---------------------------图片下载结束，关闭本窗口即可退出程序----------------------------')
        console.log('---------------------------如果是脚本运行则使用“Ctrl+C键”停止运行----------------------------\r\n')
    } catch (err) {
        console.log(err)
    }
}


//数据清洗方法
async function getImgInfo(str) {
//设定正则匹配规则
    const urlReg = /(https?|http|ftp|file):\/\/.*\.jpg/g;//这个规则刚好满足匹配1999官网的图片链接，如：https://gamecms-res.sl916.com/official_website_resource/50001/4/PICTURE/20231114/94 1125x2436_ab8fa9a53d16415297e2d2160d5a7de6.jpg
    const indexReg = /\d{1,3}/g //匹配连续的1-3位数字
    str = str.replace(/\s/g, "%20")//替换网址间的空格获取网址
    str = str.match(urlReg)//是一个数组
    if (str === null) return //匹配到空的则返回
    //分割图片信息
    const imgUrl = str[0]
    const strList = imgUrl.split('/')
    const time = Number(strList[strList.length - 2]) //这个规则匹配文件夹名，如：20231114
    const oldName = strList[strList.length - 1].replace(/%20/g, ' ')   //获取图片名称并替换20%为空格，例如：185%201125x2436_16e74393815d4aacbbbbb60c8f106de0.jpg
    let index = oldName.match(indexReg)[0] //匹配名字开头1-3位连续的数字
    if (oldName === "Rock'n'roll!-1125x2436_69c37999272740aeb905e5d98d3efd68.jpg") index = '1' //例外情况，手动排除

    const [name, halfName] = oldName.split('_')
    const [hash, format] = halfName.split('\.')   //分割.符号左右部分, 获取文件后缀名(format)
    const newName = (name + '.' + format)//拼接新名称
    //region判断版本
    let version = ''
    let versionName = ''
    if (time === 20230325 || time === 20230328) {
        version = '10'
        versionName = 'V1.0_公测及之前'
    } else if (time === 20230712) {
        version = '11'
        versionName = 'V1.1_雷米特杯失窃案'
    } else if (time === 20230823) {
        version = '12'
        versionName = 'V1.2_绿湖噩梦'
    } else if (time === 20231003 || time === 20231031) {
        version = '13'
        versionName = 'V1.3_行至摩卢旁卡'
    } else if (time === 20231114) {
        version = '14'
        versionName = 'V1.4_洞穴的囚徒'
    } else if (time === 20231226) {
        version = '15'
        versionName = 'V1.5_乌卢鲁运动会'
    } else if (time === 20240205) {
        version = '16'
        versionName = 'V1.6_朔日手记'
    } else if (time === 20240327) {
        version = '17'
        versionName = 'V1.7_今夜星光灿烂'
    } else if (time === 20240501) {
        version = '18'
        versionName = 'V1.8_再见，来亚什基'
    } else if (time === 20240612) {
        version = '19'
        versionName = 'V1.9_孤独之歌'
    }
    //因为官方上传时间间隔不固定，不好判断，所以这里写死判断，每次更新再改
    else {
        version = '1999'
        versionName = '其他版本'
    }
//endregion
    return {time, oldName, newName, imgUrl, version, versionName, index}
}


//图片下载函数，下载并分类
async function downloadImg(newPath, imgInfo) {
    try {
        const PCImgPath = imgInfo.imgPath
        const phoneImgPath = newPath + imgInfo.newName
        //默认存入PCImg文件夹
        const fileWriter = fs.createWriteStream(PCImgPath);
        const response = await fetch(imgInfo.imgUrl);
        // 检查响应是否成功（状态码在200-299之间）
        if (!response.ok) new Error(`无法获取图片：${response.statusText}`);
        // 确保响应主体可读
        if (!response.body) new Error(`响应主体不可读`);
        //确保文件已写入
        await pipelineAsync(response.body, fileWriter)
        // 确保文件正确写入
        if (fs.statSync(PCImgPath).size === 0) new Error('下载的文件为空(0KB)')

        //检查图片分辨率，并进行分类
        const readStream = fs.createReadStream(PCImgPath);
        const dimensions = await probe(readStream);
        readStream.destroy();       // 关闭流
        // const dimensions = await sharp(PCImgPath).metadata();
        //判断是否是竖屏图片
        if (dimensions.width < dimensions.height) {
            //将新地址修改并写入phoneUrlArr
            imgInfo.imgPath = phoneImgPath
            imgInfo.sort = 1//1为竖屏壁纸

            // 移动图片
            fs.rename(PCImgPath, phoneImgPath, err => {
                if (err) new Error(err.message)
            })
        }
    } catch (err) {
        //图片移动出错，但已经移动了
        console.log('\r\n' + err.message)
        console.log('图片' + imgInfo.newName + '可能未下载成功，请检查路径：' + imgInfo.imgPath + '或路径：' + newPath + imgInfo.newName)
        console.log('\r\n如图片有问题请手动下载：' + imgInfo.imgUrl)
        errorUrlStr += imgInfo.imgUrl + '\r\n'
        errorArr.push(imgInfo)
    }
}