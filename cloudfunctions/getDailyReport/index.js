const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function todayStr() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

exports.main = async (event) => {
  try {
    const date = (event && event.date) || todayStr()
    console.log('[getDailyReport] query date:', date)

    const res = await db.collection('daily_reports').where({ date }).limit(1).get()

    if (res.data.length > 0) {
      return { code: 0, message: 'success', data: res.data[0] }
    }

    // 当天未生成时，回退返回最新一期
    console.log('[getDailyReport] no report for', date, ', fallback to latest')
    const latest = await db
      .collection('daily_reports')
      .orderBy('date', 'desc')
      .limit(1)
      .get()

    if (latest.data.length === 0) {
      return { code: -1, message: '暂无早报数据，请等待首次抓取任务运行', data: null }
    }
    return { code: 0, message: 'success', data: latest.data[0] }
  } catch (err) {
    console.error('[getDailyReport] error:', err)
    return { code: -1, message: err.message || '服务异常', data: null }
  }
}
