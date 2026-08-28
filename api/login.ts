/**
 * 登录接口（H5 版本）
 * 微信端原本用 wx.login 换 openid，H5 没有这套，直接返回一个随机/固定的访客 id
 * 个人自用场景足够，不涉及真实身份
 */
export const runtime = 'nodejs'

export async function GET() {
  // 简单起见，用固定访客 id；如需区分设备可前端生成后传入
  return Response.json({ code: 0, message: 'success', data: { openid: 'h5_guest_user' } })
}
