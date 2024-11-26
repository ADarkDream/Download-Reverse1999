const express = require('express')
const app = express()
const probe = require('probe-image-size')//检查图片分辨率
const fs = require("fs")
const { pipeline } = require('stream')
const { promisify } = require('util')
const pipelineAsync = promisify(pipeline)
const { port, filePath, PCDir, phoneDir, listPath, cycle, targetVersions, versions } = require('./config')


let errorUrlStr = ''
let errorArr = []
let allImgInfoArr = []
// 版本时间和版本名称的映射对象
const timeVersionMap = {}

process.env.NODE_NO_WARNINGS = ''//忽略掉fetch的实验性警告，使它不打印到控制台

// 启动服务器
app.listen(port, async () => {
    console.log('---------------------------------------------脚本说明(V1.3.0)-----------------------------------------\r\n')
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
    console.log('\r\n-----------------------------------下面是程序输出------------------------------------\r\n')
    await start()
}
)

//主函数
async function start() {
    try {
        // 检查目标文件夹是否存在，如果不存在则创建
        if (!fs.existsSync(PCDir)) fs.mkdirSync(PCDir, { recursive: true })
        if (!fs.existsSync(phoneDir)) fs.mkdirSync(phoneDir, { recursive: true })
        if (!fs.existsSync(listPath)) fs.mkdirSync(listPath, { recursive: true })
        let allUrl = []
        //创建版本时间和版本名称的映射对象
        createTimeMap()

        //判断是否存在filePath文件
        if (fs.existsSync(filePath)) {
            console.log('已读取到' + filePath + '文件，将下载本地文件内的链接')
            //从filePath文件中读取数据，并分割字符串
            const data = fs.readFileSync(filePath).toString()
            allUrl = [...data.matchAll(/(https?|http|ftp|file):\/\/.*\.jpg/g)].map(match => match[0])
        } else {
            console.error('没有找到' + filePath + '文件，将使用深蓝接口进行下载全部图片')
            //使用深蓝接口,并根据要下载的版本号清洗链接
            allUrl = await getImgUrlByAPI()
        }
        allUrl = [...new Set(allUrl)] //图片链接数组,通过Set函数去重

        if (allUrl.length === 0) throw new Error('图片链接数组为空')
        console.log('将要下载的图片数量为：', allUrl.length)
        //下载并获取图片信息数组
        allImgInfoArr = await Promise.all(
            //遍历图片链接数组
            allUrl.map(async (imgUrl) => {
                //清洗数据，获取网址信息
                const imgInfo = getImgInfo(imgUrl)
                if (imgInfo === undefined) return
                imgInfo.imgPath = PCDir + imgInfo.newName
                imgInfo.sort = 0    //0为横屏壁纸

                // console.log('正在下载：', imgInfo.newName)  //185 1125x2436.jpg
                //开始下载图片,并对图片分类处理
                await downloadImg(phoneDir, imgInfo)
                return imgInfo
            }))
        //重新下载下载失败的图片，最多循环三次
        await download(phoneDir)

        console.log('\r\n------------------------------------请查看以下说明-------------------------------------\r\n')
        console.log('| 竖屏图片已下载到' + phoneDir + '目录下')
        console.log('| 横屏图片已下载到' + PCDir + '目录下')
        console.log('| 图片各类信息已保存到' + listPath + '目录下')
        console.log('| 重复的图片只保留一份。')


        //排序：根据官方上传时间(版本时间)和图片命名序号排序
        allImgInfoArr.sort((a, b) => {
            if (a.time === b.time) return a.index - b.index
            else return a.time - b.time
        })

        //分类：分类导出
        let PCUrlArr = []
        let phoneUrlArr = []
        allImgInfoArr.forEach(item =>
            item.sort === 0 ? PCUrlArr.push(item) : phoneUrlArr.push(item)     //0为横屏,1为竖屏
        )

        fs.writeFileSync(listPath + '/allUrl.txt', allUrl.join('\r\n')) //全部图片链接
        fs.writeFileSync(listPath + '/allUrl.json', JSON.stringify(allImgInfoArr))//全部图片信息
        fs.writeFileSync(listPath + '/PCUrlList.json', JSON.stringify(PCUrlArr))//横屏图片信息
        fs.writeFileSync(listPath + '/phoneUrlList.json', JSON.stringify(phoneUrlArr))//竖屏图片信息
        console.log('\r\n--  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --\r\n')
        console.log('| 网址筛选成功,共' + allUrl.length + '个链接，存放到以下文件中（已去除重复链接）：')
        console.log('| ' + listPath + '/allUrlList.json 中存放全部壁纸信息[' + allImgInfoArr.length + '条]（JSON格式）')
        console.log('| ' + listPath + '/PCUrlList.json 中存放横屏壁纸信息[' + PCUrlArr.length + '条]（JSON格式）')
        console.log('| ' + listPath + '/phoneUrlList.json 中存放竖屏壁纸信息[' + phoneUrlArr.length + '条]（JSON格式）')
        console.log('| ' + listPath + '/allUrl.txt中存放全部壁纸链接（TXT格式,网址通过空格隔开,可以复制到其他下载器批量下载）')
        if (errorUrlStr !== '' && errorArr.length !== 0) {
            fs.writeFileSync(listPath + '/errorUrl.txt', errorUrlStr)
            fs.writeFileSync(listPath + '/errorUrlList.json', JSON.stringify(errorArr))
            console.error('\r\n| 本次下载有图片下载出错,上述JSON文件中包含下载失败的图片信息，请手动修改错误的图片的分类信息')
            console.error('| ' + listPath + '/errorUrl.txt中存放可能下载出错的壁纸链接，请自行手动下载')
            console.error('| ' + listPath + '/errorUrl.json中存放可能下载出错的壁纸信息[' + errorArr.length + '条]（JSON格式）')
            console.error('| 建议将已下载的图片和图片信息文件夹备份后,将errorUrl.txt复制并重命名为url.txt,再重新运行本脚本')
        }
        console.log('\r\n---------------------------图片下载结束，关闭本窗口即可退出程序----------------------------')
        console.log('---------------------------如果是脚本运行则使用“Ctrl+C键”停止运行----------------------------\r\n')
    } catch (err) {
        console.error(err.message)
        console.error('\r\n--------------------------------------已停止运行----------------------------------------\r\n')
    }
}


//数据清洗方法：获取图片信息
function getImgInfo(imgUrl) {
    //设定正则匹配规则
    const indexReg = /\d{1,3}/g //匹配连续的1-3位数字
    //分割图片信息
    const strList = imgUrl.split('/')
    const time = strList[strList.length - 2] //这个规则匹配文件夹名，如：20231114
    const oldName = strList[strList.length - 1].replace(/%20/g, ' ')   //获取图片名称并替换20%为空格，例如：185%201125x2436_16e74393815d4aacbbbbb60c8f106de0.jpg
    let index = Number(oldName.match(indexReg)[0]) //匹配名字开头1-3位连续的数字
    if (oldName === "Rock'n'roll!-1125x2436_69c37999272740aeb905e5d98d3efd68.jpg") index = 1 //例外情况，手动排除

    const [name, halfName] = oldName.split('_')
    const [hash, format] = halfName.split('\.')   //分割.符号左右部分, 获取文件后缀名(format)
    const newName = (name + '.' + format)//拼接新名称

    //判断版本
    const { version, versionName } = timeVersionMap[time]
        ? timeVersionMap[time]
        : { version: 1999, versionName: '其他版本' }

    return { time, oldName, newName, imgUrl, version, versionName, index }
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
        imgInfo.height = dimensions.height
        imgInfo.width = dimensions.width
        // console.log('dimensions', dimensions)

        readStream.destroy()       // 关闭流
        // const dimensions = await sharp(PCImgPath).metadata()
        //判断是否是竖屏图片
        if (dimensions.width < dimensions.height) {
            //将新地址修改并写入phoneUrlArr
            imgInfo.imgPath = phoneImgPath
            imgInfo.sort = 1//1为竖屏壁纸

            // 移动图片
            await fs.promises.rename(PCImgPath, phoneImgPath, err => {
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

//重新下载下载失败的图片
async function download(phoneDir) {
    if (errorArr.length === 0) return
    console.log('\r\n--------------------------------------正在重新下载下载失败的图片--------------------------------------')
    const errorList = errorArr
    errorUrlStr = ''
    errorArr = []
    const result = await Promise.all(
        //遍历图片链接数组
        errorList.map(async (imgInfo) => {
            // console.log('正在下载：', imgInfo.newName)  //185 1125x2436.jpg
            //开始下载图片,并对图片分类处理
            await downloadImg(phoneDir, imgInfo)
            return imgInfo
        }))
    allImgInfoArr = mergeArrays(allImgInfoArr, result) //合并两个数组

    cycle--
    if (cycle === 0) return console.log('已重试多次下载，仍有错误，已退出递归')
    if (errorUrlStr !== '') await download(phoneDir) //如果还有下载错误，则递归
    console.log('--------------------------------------下载失败的图片已成功重新下载--------------------------------------')
}

//合并数组
function mergeArrays(target, update) {
    // 将两个数组添加到对象中，imgUrl为key，数组的值为value，合并之后把对象转为数组返回
    let obj = {}
    target.forEach(item => obj[item.imgUrl] = item)
    // 遍历新的数组，更新或插入到 aDict 中
    update.forEach(item => obj[item.imgUrl] = item)

    return Object.values(obj)// 将字典转换回数组
}

//从官方接口获取图片链接
const getImgUrl = async (pageSize = 1) => {
    try {
        const response = await fetch('https://re.bluepoch.com/activity/official/websites/picture/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                current: 1,
                pageSize
            })
        })

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const result = await response.json()
        const { code, data, msg } = result

        if (code === 200) {
            const { pageData, total, current, pageSize } = data
            console.log(`共有${total}条数据，当前第${current}页，每页${pageSize}条数据`)
            const urlArr = pageData.map(item => item.pictureUrl).filter(url => url !== undefined)
            // console.log(urlArr)
            return { urlArr, total }
        }
    } catch (error) {
        console.error('获取图片链接失败:', error)
    }
}

//根据要下载的版本号清洗链接
const getImgUrlByAPI = async () => {
    //获取最新一张，获取总数
    const { total } = await getImgUrl()
    //获取全部链接
    const { urlArr } = await getImgUrl(total)
    //下载全部
    if (versions.length === 0) {
        console.log('将要下载全部以影像之图片')
        return urlArr
    }
    //下载目标版本
    console.log('将要下载版本为：' + targetVersions.join(',') + '的以影像之图片')
    const targetTimes = Object.keys(timeVersionMap).filter(time =>
        targetVersions.includes(timeVersionMap[time].version)
    )

    // 筛选包含 targetTimes 的链接
    return urlArr.filter(url =>
        targetTimes.some(time => url.includes(`/PICTURE/${time}/`))
    )
}

const createTimeMap = () => {
    // 创建 time 和 version+versionName 的映射对象
    versions.forEach(item => {
        item.time.forEach(time => {
            timeVersionMap[time] = { version: item.version, versionName: item.versionName }
        })
    })
}