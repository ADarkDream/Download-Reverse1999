const express = require('express')
const app = express()
const port = 3000 // 您可以使用任何端口
const probe = require('probe-image-size')//检查图片分辨率
const fs = require("fs")
const {pipeline} = require('stream')
const {promisify} = require('util')
const pipelineAsync = promisify(pipeline)

let errorUrlStr = ''
let errorArr = []

process.env.NODE_NO_WARNINGS = ''//忽略掉fetch的实验性警告，使它不打印到控制台

app.get('/', async (req, res) => {
    try {
        res.send('你好，不用在意这个窗口，请查看文件夹中你需要下载的图片')
    } catch (err) {
        console.log(err)
    }
})

// 启动服务器
app.listen(port, async () => {
        console.log('---------------------------------------------脚本说明(V1.2.4)-----------------------------------------\r\n')
        console.log(`【本脚本运行过程中会占用端口：127.0.0.1: ${port}，关闭脚本即可释放】\n` +
            '【注意：首次运行可能因为提醒联网权限的问题无法成功下载图片，授权之后关闭程序然后再次运行即可】\n' +
            '| 本脚本程序仅用于批量下载1999国服官网的图片，仅作为技术分享，请勿用于其他用途。侵权请联系删除。\r\n' +
            '| 项目地址：\n' +
            ' [Gitee@默默](https://gitee.com/MuXi-Dream/download-reverse1999) ；\n' +
            ' [GitHub@默默](https://github.com/ADarkDream/Download-Reverse1999)  \n' +
            ' [API文档](https://apifox.com/apidoc/auth-shared-70082832-e502-49ac-a386-35af15bfd747?redirect=%2Fshared-70082832-e502-49ac-a386-35af15bfd747%2Fapi-186774719&&type=shareDoc)API文档主要是壁纸链接表及角色信息表，用于给图片分类，见下方[默默的小站]。如有需要API文档可找我要密码\r\n' +
            '| 为方便使用，已将本项目功能上线，可前往[默默的小站](https://muxidream.cn/reverse1999)分类筛选并下载\r\n' +
            '| 其它联系方式：[微博@玖优梦](https://weibo.com/u/6869134755)（微博私信我会自动回复链接）\r\n' +
            '| 百度网盘链接：[重返未来1999](https://pan.baidu.com/s/1A4o9VM4kPa_vzWZEtHiZSA?pwd=1999)\n' +
            '  预防网盘链接失效，可以保存：[1999资源总表：金山云文档](https://kdocs.cn/l/cjkqngyqWLTI)')
        await start()
    }
)


async function start() {
    try {
        //判断是否存在url.txt文件
        if (!fs.existsSync('url.txt'))
            throw new Error('当前目录下没有找到url.txt文件，使用本脚本程序前请先前往项目地址阅读使用说明')
        //定义图片存储文件夹
        const PCDir = './image/PCImg/'
        const phoneDir = './image/phoneImg/'
        // 检查目标文件夹是否存在，如果不存在则创建
        if (!fs.existsSync(PCDir)) fs.mkdirSync(PCDir, {recursive: true})
        if (!fs.existsSync(phoneDir)) fs.mkdirSync(phoneDir, {recursive: true})
        if (!fs.existsSync('./urlList')) fs.mkdirSync('./urlList', {recursive: true})

        //从url.txt文件中读取数据，并分割字符串
        const data = fs.readFileSync("./url.txt").toString()
        let allUrl = [...data.matchAll(/(https?|http|ftp|file):\/\/.*\.jpg/g)].map(match => match[0])
        allUrl = [...new Set(allUrl)] //图片链接数组,通过Set函数去重

        //获取图片信息数组
        let allImgInfoArr = await Promise.all(
            //遍历data
            allUrl.map(async (imgUrl) => {
                //清洗数据，获取网址信息
                const imgInfo = await getImgInfo(imgUrl)
                if (imgInfo === undefined) return
                imgInfo.imgPath = PCDir + imgInfo.newName
                imgInfo.sort = 0    //0为横屏壁纸

                // console.log('正在下载：', imgInfo.newName)  //185 1125x2436.jpg
                //开始下载图片,并对图片分类处理
                await downloadImg(phoneDir, imgInfo).catch(error => console.error(`下载失败，图片链接为：${imgUrl}`, error))
                return imgInfo
            }))
        console.log('\r\n------------------------------------请查看以下说明-------------------------------------\r\n')
        console.log('| 竖屏图片已下载到/image/phoneImg/目录下')
        console.log('| 横屏图片已下载到/image/PCImg/目录下')
        console.log('| 图片各类信息已保存到/urlList目录下')
        console.log('| 重复的图片只保留一份。')


        //排序：根据官方上传时间(版本时间)和图片命名序号排序
        allImgInfoArr.sort((a, b) => {
            const timeA = a.time
            const timeB = b.time
            const indexA = parseInt(a.index, 10)
            const indexB = parseInt(b.index, 10)
            if (timeA === timeB) return indexA - indexB
            else return timeA - timeB
        })

        //清洗： 清洗空的数据,必须赋给新数组
        // const resArr = allImgInfoArr.filter(item => item !== undefined)
        //分类：分类导出
        let PCUrlArr = []
        let phoneUrlArr = []
        allImgInfoArr.forEach(item =>
            item.sort === 0 ? PCUrlArr.push(item) : phoneUrlArr.push(item)     //0为横屏,1为竖屏
        )

        fs.writeFileSync('./urlList/allUrl.txt', allUrl.join('\r\n')) //全部图片链接
        fs.writeFileSync('./urlList/allUrl.json', JSON.stringify(allImgInfoArr))//全部图片信息
        fs.writeFileSync('./urlList/PCUrlList.json', JSON.stringify(PCUrlArr))//横屏图片信息
        fs.writeFileSync('./urlList/phoneUrlList.json', JSON.stringify(phoneUrlArr))//竖屏图片信息
        console.log('\r\n--  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --\r\n')
        console.log('| 网址筛选成功,共' + allUrl.length + '个链接，存放到以下文件中（已去除重复链接）：')
        console.log('| ./urlList/allUrlList.json 中存放全部壁纸信息[' + allImgInfoArr.length + '条]（JSON格式）')
        console.log('| ./urlList/PCUrlList.json 中存放横屏壁纸信息[' + PCUrlArr.length + '条]（JSON格式）')
        console.log('| ./urlList/phoneUrlList.json 中存放竖屏壁纸信息[' + phoneUrlArr.length + '条]（JSON格式）')
        console.log('| ./urlList/allUrl.txt中存放全部壁纸链接（TXT格式,网址通过空格隔开,可以复制到其他下载器批量下载）')
        if (errorUrlStr !== '') {
            fs.writeFileSync('./urlList/errorUrl.txt', errorUrlStr)
            fs.writeFileSync('./urlList/errorUrlList.json', JSON.stringify(errorArr))
            console.log('\r\n| 本次下载有图片下载出错,上述JSON文件中包含下载失败的图片信息，请手动修改错误的图片的分类信息')
            console.log('| ./urlList/errorUrl.txt中存放可能下载出错的壁纸链接，请自行手动下载')
            console.log('| ./urlList/errorUrl.json中存放可能下载出错的壁纸信息[' + errorArr.length + '条]（JSON格式）')
            console.log('| 建议将文件夹image和urlList备份后,将errorUrl.txt复制并重命名为url.txt,再重新运行本脚本')

        }
        console.log('\r\n---------------------------图片下载结束，关闭本窗口即可退出程序----------------------------')
        console.log('---------------------------如果是脚本运行则使用“Ctrl+C键”停止运行----------------------------\r\n')
    } catch (err) {
        console.log('\r\n-----------------------------------下面是程序错误输出------------------------------------\r\n')
        console.log(err.message)
        console.log('\r\n--------------------------------------已停止运行----------------------------------------\r\n')
    }
}


//数据清洗方法：获取图片信息
async function getImgInfo(imgUrl) {
//设定正则匹配规则
//     const urlReg = /(https?|http|ftp|file):\/\/.*\.jpg/g//这个规则刚好满足匹配1999官网的图片链接，如：https://gamecms-res.sl916.com/official_website_resource/50001/4/PICTURE/20231114/94 1125x2436_ab8fa9a53d16415297e2d2160d5a7de6.jpg
    const indexReg = /\d{1,3}/g //匹配连续的1-3位数字
    // imgUrl = imgUrl.replace(/\s/g, "%20")//替换网址间的空格获取网址
    // imgUrl = imgUrl.match(urlReg)//是一个数组
    // if (imgUrl === null) return //匹配到空的则返回
    // //分割图片信息
    // const imgUrl = imgUrl[0]
    const strList = imgUrl.split('/')
    const time = Number(strList[strList.length - 2]) //这个规则匹配文件夹名，如：20231114
    const oldName = strList[strList.length - 1].replace(/%20/g, ' ')   //获取图片名称并替换20%为空格，例如：185%201125x2436_16e74393815d4aacbbbbb60c8f106de0.jpg
    let index = Number(oldName.match(indexReg)[0]) //匹配名字开头1-3位连续的数字
    if (oldName === "Rock'n'roll!-1125x2436_69c37999272740aeb905e5d98d3efd68.jpg") index = 1 //例外情况，手动排除

    const [name, halfName] = oldName.split('_')
    const [hash, format] = halfName.split('\.')   //分割.符号左右部分, 获取文件后缀名(format)
    const newName = (name + '.' + format)//拼接新名称
    //region判断版本
    let version
    let versionName
    if (time === 20230325 || time === 20230328) {
        version = 10
        versionName = 'V1.0_公测及之前'
    } else if (time === 20230712) {
        version = 11
        versionName = 'V1.1_雷米特杯失窃案'
    } else if (time === 20230823) {
        version = 12
        versionName = 'V1.2_绿湖噩梦'
    } else if (time === 20231003 || time === 20231031) {
        version = 13
        versionName = 'V1.3_行至摩卢旁卡'
    } else if (time === 20231114) {
        version = 14
        versionName = 'V1.4_洞穴的囚徒'
    } else if (time === 20231226) {
        version = 15
        versionName = 'V1.5_乌卢鲁运动会'
    } else if (time === 20240205) {
        version = 16
        versionName = 'V1.6_朔日手记'
    } else if (time === 20240327) {
        version = 17
        versionName = 'V1.7_今夜星光灿烂'
    } else if (time === 20240501) {
        version = 18
        versionName = 'V1.8_再见，来亚什基'
    } else if (time === 20240612) {
        version = 19
        versionName = 'V1.9_孤独之歌'
    }
    //因为官方上传时间间隔不固定，不好判断，所以这里写死判断，每次更新再改
    else {//如果没来得及更新，统一为版本号为1999
        version = 1999
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
        const fileWriter = fs.createWriteStream(PCImgPath)
        const response = await fetch(imgInfo.imgUrl)
        // 检查响应是否成功（状态码在200-299之间）
        if (!response.ok) throw new Error(`无法获取图片：${response.statusText}`)
        // 确保响应主体可读
        if (!response.body) throw new Error(`响应主体不可读`)
        //确保文件已写入
        await pipelineAsync(response.body, fileWriter)
        // 确保文件正确写入
        if (fs.statSync(PCImgPath).size === 0) throw new Error('下载的文件为空(0KB)')

        //检查图片分辨率，并进行分类
        const readStream = fs.createReadStream(PCImgPath)
        const dimensions = await probe(readStream)
        readStream.destroy()       // 关闭流
        // const dimensions = await sharp(PCImgPath).metadata()
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
        errorUrlStr += imgInfo.imgUrl + ',\n'
        errorArr.push(imgInfo)
    }
}