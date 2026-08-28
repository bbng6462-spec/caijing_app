import dayjs from 'dayjs'
import { DailyReport } from '../types/finance'

// Mock：getDailyReport 云函数（H5 预览用）
export default function getDailyReport(): DailyReport {
  return {
    date: dayjs().format('YYYY-MM-DD'),
    oneLineSummary:
      '国内政策面暖风持续，市场情绪偏暖；隔夜美股科技股回落，国际油价窄幅震荡，今日关注国内消费数据发布。',
    highlights: [
      {
        category: 'macro',
        headline: '统计局公布最新消费数据，社会消费品零售总额同比增长 4.6%，恢复势头好于预期',
        count: 3
      },
      {
        category: 'stock',
        headline: '两市成交额重回万亿元上方，券商板块午后拉升，市场风格转向低估值蓝筹',
        count: 4
      },
      {
        category: 'global',
        headline: '美联储官员放鸽，市场下调今年降息次数预期；国际金价站稳 2400 美元关口',
        count: 2
      },
      {
        category: 'tech',
        headline: '多家云厂商宣布大模型 API 降价，AI 应用成本进一步下探，产业链关注度高',
        count: 3
      },
      {
        category: 'policy',
        headline: '多部门联合发文支持消费品以旧换新，地方补贴细则陆续落地，惠及家电汽车',
        count: 3
      }
    ],
    articleCount: 15,
    generatedAt: dayjs().hour(7).minute(0).second(0).toISOString()
  }
}
