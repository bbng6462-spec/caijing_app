const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async () => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    console.log('[login] openid:', openid ? 'ok' : 'empty')

    return { code: 0, message: 'success', data: { openid: openid || '' } }
  } catch (err) {
    console.error('[login] error:', err)
    return { code: -1, message: err.message || '服务异常', data: null }
  }
}
