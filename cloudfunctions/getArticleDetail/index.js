const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  try {
    const id = event && event.id
    if (!id) {
      return { code: -1, message: '缺少文章 id', data: null }
    }

    const res = await db.collection('articles').doc(id).get()
    console.log('[getArticleDetail] loaded:', id)

    return { code: 0, message: 'success', data: res.data }
  } catch (err) {
    console.error('[getArticleDetail] error:', err)
    return { code: -1, message: err.message || '文章不存在或已下线', data: null }
  }
}
