/**重返未来1999以影像之接口信息*/
export type DownloadResult = {
  /**图片信息*/
  pageData: [
    {
      /**图片id*/
      id: number
      /**游戏id(默认是50001，指重返未来1999)*/
      gameId: number
      /**未知参数,默认为4*/
      envType: number
      /**图片名称"537 1440x2560"*/
      title: string
      /**图片描述*/
      desc: string | null
      /**未知参数*/
      collectionId: number
      /**图片状态，默认为1*/
      status: number
      /**上传时间 YYYY-MM-DD HH:mm:ss*/
      onlineTime: string
      /**下线时间 YYYY-MM-DD HH:mm:ss*/
      offlineTime: string
      /**图片url链接*/
      pictureUrl: string
      /**未知，可能与图片序号有关*/
      weight: number
      /**最后更新时间 YYYY-MM-DD HH:mm:ss*/
      updateTime: string
    },
  ]
  /**图片总数*/
  total: number
  /**当前页码*/
  current: number
  /**每页数量*/
  pageSize: number
}
