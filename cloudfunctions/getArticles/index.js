const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  try {
    const category = event && event.category
    const page = Math.max(1, Number((event && event.page) || 1))
    const pageSize = Math.min(20, Math.max(1, Number((event && event.pageSize) || 10)))

    let query = db.collection('articles')
    if (category) {
      query = query.where({ category })
    } else {
      query = query.where({})
    }

    const countRes = await query.count()
    const total = countRes.total

    const res = await query
      .orderBy('publishedAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    console.log(
      `[getArticles] category=${category || 'all'} page=${page} got=${res.data.length}/${total}`
    )

    return {
      code: 0,
      message: 'success',
      data: {
        list: res.data,
        hasMore: (page - 1) * pageSize + res.data.length < total
      }
    }
  } catch (err) {
    console.error('[getArticles] error:', err)
    return { code: -1, message: err.message || '服务异常', data: null }
  }
}
