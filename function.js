const fs = require("fs")
const https = require('https');
const probe = require('probe-image-size')//检查图片分辨率
require('dotenv').config();

// 检查config.json是否存在，如果不存在则退出
const config_path = './config.json'
if (!fs.existsSync(config_path)) return console.error('配置文件config.json不存在，请将config.json文件放在当前目录下')
const config = JSON.parse(fs.readFileSync(config_path, 'utf-8'))
const { localVersion, isCheckUpadte, waitTime, filePath, PCDir, phoneDir, maxConcurrent, listPath, targetVersions, versions } = config
const { dic_md5 } = require('./dictionary');

let errorUrlStr = ''
let errorArr = []
let allImgInfoArr = []
// 版本时间和版本名称的映射对象
let timeVersionMap = {}

const pc_dir = PCDir || './image/PCImg/'
const phone_dir = phoneDir || './image/phoneImg/'
const wait_time = waitTime || 5000
const list_path = listPath || './urlList/'
const path_all = list_path + 'allUrl.txt'
const path_all_json = list_path + 'allUrlList.json'
const path_pc_json = list_path + 'PCUrlList.json'
const path_phone_json = list_path + 'phoneUrlList.json'
const path_error = list_path + 'errorUrl.txt'
const path_error_json = list_path + 'errorUrlList.json'


const fun = {
    //主函数
    start: async () => {
        try {
            // 检查目标文件夹是否存在，如果不存在则创建
            if (!fs.existsSync(pc_dir)) fs.mkdirSync(pc_dir, { recursive: true })
            if (!fs.existsSync(phone_dir)) fs.mkdirSync(phone_dir, { recursive: true })
            if (!fs.existsSync(list_path)) fs.mkdirSync(list_path, { recursive: true })
            let allUrl = []
            //创建版本时间和版本名称的映射对象
            fun.createTimeMap()

            //判断是否存在filePath文件
            if (fs.existsSync(filePath)) {
                console.log('已读取到' + filePath + '文件，将下载本地文件内的链接')
                //从filePath文件中读取数据，并分割字符串
                const data = fs.readFileSync(filePath).toString()
                allUrl = [...data.matchAll(/(https?|http|ftp|file):\/\/.*\.jpg/g)].map(match => match[0])
            } else {
                console.warn('没有找到' + filePath + '文件，将使用深蓝接口进行下载全部图片')
                //使用深蓝接口,并根据要下载的版本号清洗链接
                allUrl = await fun.getImgUrlByAPI()
            }
            allUrl = [...new Set(allUrl)] //图片链接数组,通过Set函数去重

            if (allUrl.length === 0) throw new Error('图片链接数组为空')
            console.warn('将要下载的图片数量为：', allUrl.length)
            console.log('开始预处理图片数据');
            //预处理图片信息【清洗数据，获取网址信息】
            allImgInfoArr = allUrl.map(fun.getImgInfo).filter(imgInfo => imgInfo !== undefined)

            console.log('预处理完成，开始下载');
            await fun.batchDownload(allImgInfoArr, maxConcurrent || 3);
            console.log('所有文件下载完成,开始按分辨率分类');

            const tempImgInfoArr = await Promise.all(allImgInfoArr.map(fun.reWriteInfo))

            allImgInfoArr = tempImgInfoArr.filter(imgInfo => imgInfo !== undefined)

            console.log('分类完成，开始排序');
            //排序：根据官方上传时间(版本时间)和图片命名序号排序
            // 排序逻辑：先按 time 从小到大，再按 index 从小到大
            allImgInfoArr.sort((a, b) => {
                if (a.time === b.time) {
                    return a.index - b.index; // time 相同，按 index 排序
                }
                return a.time - b.time  //按 time 排序
                // return a.time.localeCompare(b.time); // 如果time是字符串，按 time 排序（字符串比较）
            });
            console.log('排序完成，图片信息处理完成');

            console.warn('\n--  --  --  --  --  --  --  --  --  --  --  -- 目录说明 --  --  --  --  --  --  --  --  --  --  --  --\n' +
                '| 竖屏图片已下载到' + phone_dir + '目录下\n' +
                '| 横屏图片已下载到' + pc_dir + '目录下\n' +
                '| 图片各类信息已保存到' + list_path + '目录下\n' +
                '| 重复的图片只保留一份。' +
                '--  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --  --\n')
            //分类：分类导出
            let PCUrlArr = []
            let phoneUrlArr = []
            allImgInfoArr.forEach(item =>
                item.sort === 0 ? PCUrlArr.push(item) : phoneUrlArr.push(item)     //0为横屏,1为竖屏
            )
            fs.writeFileSync(path_all, allUrl.join('\n')) //全部图片链接
            fs.writeFileSync(path_all_json, JSON.stringify(allImgInfoArr))//全部图片信息
            fs.writeFileSync(path_pc_json, JSON.stringify(PCUrlArr))//横屏图片信息
            fs.writeFileSync(path_phone_json, JSON.stringify(phoneUrlArr))//竖屏图片信息
            console.log(
                `| 网址筛选成功,共${allUrl.length}个链接，图片信息存放到以下文件中（已去除重复链接）：\n` +
                `| ${path_all} 中存放全部壁纸链接[${allImgInfoArr.length}条]（TXT格式,网址通过空行隔开,可以复制到其他下载器批量下载）\n` +
                `| ${path_all_json} 中存放全部壁纸信息[${allImgInfoArr.length}条]（JSON格式）\n` +
                `| ${path_pc_json} 中存放横屏壁纸信息[${PCUrlArr.length}条]（JSON格式）\n` +
                `| ${path_phone_json} 中存放竖屏壁纸信息[${phoneUrlArr.length}条]（JSON格式）`)
            if (errorUrlStr !== '' && errorArr.length !== 0) {
                fs.writeFileSync(path_error, errorUrlStr)
                fs.writeFileSync(path_error_json, JSON.stringify(errorArr))
                console.error('\n| 本次下载有图片下载出错,上述JSON文件中包含下载失败的图片信息，请手动修改错误的图片的分类信息' +
                    `${path_error} 中存放可能下载出错的壁纸链接，请自行手动下载\n` +
                    `| ${path_error_json} 中存放可能下载出错的壁纸信息[${errorArr.length}条]（JSON格式）\n` +
                    '| 建议将已下载的图片和图片信息文件夹备份后,将errorUrl.txt复制并重命名为url.txt,再重新运行本脚本')
            }
            console.warn('\n----------------------------图片下载结束，关闭本窗口即可退出程序-----------------------------\n' +
                '---------------------------如果是脚本运行则使用“Ctrl+C键”停止运行----------------------------\n')
        } catch (err) {
            console.error(err.message +
                '\n--------------------------------------已停止运行----------------------------------------\n')
        }
    },
    //检查版本号
    checkVersion: async () => {
        if (!isCheckUpadte) return
        console.warn('正在检查更新，若不需要每次启动时检查更新可在配置config.js文件中关闭');
        try {
            const response = await fetch(process.env.BASE_URL || 'https://muxidream.cn/api/getLatestVersion', {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const result = await response.json()
            const { status, msg, data } = result
            if (status === 400 && msg) return console.error(msg);
            else if (status !== 200) return console.error('未知错误，检查版本号失败');
            const { download_version, server_version, update_url } = data

            if (!localVersion === download_version) {
                const time = (wait_time / 1000).toFixed(0) || 0
                console.warn('检查到更新版本\n' +
                    `当前下载器版本为：${localVersion},最新下载器版本为：${download_version}\n` +
                    `如需更新请前往:${update_url} 下载最新版本\n` +
                    `${time}秒后开始执行主函数`)
                await new Promise(resolve => setTimeout(resolve, wait_time))
            } else console.log(`当前下载器版本为：${localVersion},当前已是最新版本\n`)
        } catch (error) {
            console.error('检查版本号失败', error);
        }
    },
    //数据清洗方法：计算图片序号
    getIndex: (oldName, md5, version) => {
        let index = Number(oldName.match(/\d{1,3}/g)[0]) //匹配名字开头1-3位连续的数字
        if (md5 === "69c37999272740aeb905e5d98d3efd68") index = 1 //例外情况，手动排除
        else if (version === 15) index += 110 //例外情况，1.5版本序号清零，添加110
        else if (version === 20) index = dic_md5[md5] //例外情况，2.0版本序号较乱，根据图片上的md5值来区分序号
        return index
    },

    //数据清洗方法：获取图片信息
    getImgInfo: (imgUrl) => {
        //分割图片信息
        const strList = imgUrl.split('/')
        const time = strList[strList.length - 2] //这个规则匹配文件夹名，如：20231114
        const oldName = strList[strList.length - 1].replace(/%20/g, ' ')   //获取图片名称并替换20%为空格，例如：185%201125x2436_16e74393815d4aacbbbbb60c8f106de0.jpg
        //判断版本
        let { version, versionName } = timeVersionMap[time]
            ? timeVersionMap[time]
            : { version: 1999, versionName: '其他版本' }

        const [name, halfName] = oldName.split('_')
        const [md5, format] = halfName.split('\.')   //分割.符号左右部分, 获取文件后缀名(format)

        const index = fun.getIndex(oldName, md5, version)
        const newName = time + '_' + index + '.' + format     //拼接新名称  时间_序号.格式

        const sort = 0    //0为横屏壁纸
        const imgPath = pc_dir + newName
        return { oldName, newName, imgUrl, version, versionName, index, time, sort, imgPath, md5 }
    },


    /**
     * 下载文件并保存到指定路径
     * @param {string} url - 下载链接
     * @param {string} outputPath - 保存路径
     */
    downloadFile: async (url, outputPath) => {
        // console.log(`开始下载: ${url}`);
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(outputPath);
            https.get(url, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(() => {
                        // console.log(`完成下载: ${outputPath}`);
                        resolve(outputPath);
                    });
                });
            }).on('error', (err) => {
                console.errpr(`下载失败: ${outputPath}`);
                fs.unlink(outputPath, () => reject(err));
            });
        });
    },

    /**
     * 批量下载图片到指定路径
     * @param {Array} downloadList - 下载对象数组
     * @param {number} maxConcurrent - 最大并发数量
     */
    batchDownload: async (downloadList, maxConcurrent) => {
        let index = 0;

        const startNext = async () => {
            while (index < downloadList.length) {
                const currentIndex = index++;
                const { imgUrl, imgPath } = downloadList[currentIndex]; // 提取 imgUrl 和 imgPath
                try {
                    // 确保路径的文件夹存在
                    const dir = imgPath.substring(0, imgPath.lastIndexOf('/'));
                    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

                    // 下载文件
                    await fun.downloadFile(imgUrl, imgPath);
                } catch (error) {
                    console.error(`下载失败: ${imgUrl}`, error);
                }
            }
        };

        const workers = Array.from({ length: maxConcurrent }, () => startNext());
        await Promise.all(workers);
    },

    //图片信息终处理，判断图片分辨率并根据分辨率分类
    reWriteInfo: async (imgInfo) => {
        try {
            const PCImgPath = imgInfo.imgPath
            const phoneImgPath = phone_dir + imgInfo.newName

            // 确保文件已正确写入
            const stats = await fs.promises.stat(PCImgPath)
            if (stats.size === 0) throw new Error(`下载的文件${PCImgPath}为空 (0KB)`)

            // 检查图片分辨率
            const readStream = fs.createReadStream(PCImgPath)
            const dimensions = await probe(readStream)
            imgInfo.height = dimensions.height
            imgInfo.width = dimensions.width

            readStream.destroy() // 关闭流

            // 判断图片类型并分类
            if (dimensions.width < dimensions.height) {
                imgInfo.imgPath = phoneImgPath
                imgInfo.sort = 1 // 1为竖屏壁纸

                // 移动文件到指定位置
                await fs.promises.rename(PCImgPath, phoneImgPath)
            }
            return imgInfo
        } catch (err) {
            console.error(
                `\n${err.message}\n图片 ${imgInfo.newName} 可能未移动成功，请检查路径：${imgInfo.imgPath} 或路径：${newPath + imgInfo.newName}\n如图片有问题请手动下载：${imgInfo.imgUrl}`
            )
            errorUrlStr += imgInfo.imgUrl + '\n'
            errorArr.push(imgInfo)
        }
    },


    //从官方接口获取图片链接
    getImgUrl: async (pageSize = 1) => {
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
    },

    //根据要下载的版本号清洗链接
    getImgUrlByAPI: async () => {
        //获取最新一张，获取总数
        console.log('查询最新一张图片，获取总数');
        const { total } = await fun.getImgUrl()
        //获取全部链接
        const { urlArr } = await fun.getImgUrl(total)
        console.log('查询全部图片链接成功\n');
        //下载全部
        if (!targetVersions?.length) {
            console.log('将要下载全部以影像之图片')
            return urlArr
        }
        const versionNames = targetVersions.map(
            version => versions.find(item => item.version === version)?.versionName || '其他版本'
        )

        //下载目标版本
        console.log('将要下载版本为：【' + versionNames.join(',') + '】的以影像之图片')
        const targetTimes = Object.keys(timeVersionMap).filter(time =>
            targetVersions.includes(timeVersionMap[time].version)
        )

        // 筛选包含 targetTimes 的链接
        return urlArr.filter(url =>
            targetTimes.some(time => url.includes(`/PICTURE/${time}/`))
        )
    },

    createTimeMap: () => {
        timeVersionMap = {}
        // 创建 time 和 version+versionName 的映射对象
        versions.forEach(item => {
            item.time.forEach(time => {
                timeVersionMap[time] = { version: item.version, versionName: item.versionName }
            })
        })
    }
}

module.exports = fun