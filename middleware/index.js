// 中间件模块

/**全局中间件，精简res.send()*/
const send = (req, res, next) => {
  /**精简res.send()正确返回函数，不传status值则默认为200*/
  res.ss = (data) => {
    if (typeof data === "string") return res.send({ code: 200, msg: data })
    const { status, ...restData } = data
    res.send({
      code: status || 200,
      ...restData,
    })
  }

  /**精简res.send()错误返回函数，不传status值则默认为300*/
  res.ww = (data) => {
    if (typeof data === "string") return res.send({ code: 300, msg: data })
    const { status, ...restData } = data
    res.send({
      code: status || 300,
      ...restData,
    })
  }

  /**精简res.send()错误返回函数，不传status值则默认为400*/
  res.cc = (err, status = 400) => {
    res.send({
      code: status,
      //判断得到的err是系统的Error对象还是传递的字符串信息
      msg: err instanceof Error ? err.message : err,
    })
  }
  next()
}

const middleware = {
  send,
}

export default middleware
