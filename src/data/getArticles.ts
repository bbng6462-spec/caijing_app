import dayjs from 'dayjs'
import { Article, ArticlePage, CategoryKey } from '../types/finance'

const today = dayjs()

/** Mock 文章池（getArticleDetail 复用） */
export const MOCK_ARTICLES: Article[] = [
  {
    id: 'a001',
    title: '统计局：10 月社会消费品零售总额同比增长 4.6%，好于市场预期',
    summary:
      '简单说，就是大家花钱的劲头比专家预想的更足。10 月全国买东西（不含房子）的总花销比去年同期多了 4.6%，比机构预测的还要高一点，说明消费正在稳步回暖。',
    whyImportant: '消费是经济火车头之一，数据超预期意味着经济恢复的底子更扎实，政策也有更多腾挪空间。',
    impact: '利好零售、餐饮、家电等消费行业；对普通人的意义是就业和收入环境可能更稳。',
    category: 'macro',
    sourceName: '新浪财经',
    sourceUrl: 'https://finance.sina.com.cn',
    publishedAt: today.hour(9).subtract(0, 'day').toISOString()
  },
  {
    id: 'a002',
    title: '两市成交额重回万亿元，券商板块午后直线拉升',
    summary:
      '昨天 A 股一天成交重新突破 1 万亿元，相当于买卖股票的总额度又热起来了。券商就是靠交易量吃饭的，量一上来，券商股下午直接被买起来了。',
    whyImportant: '成交额是市场情绪的温度计，万亿是重要的心理关口，站上去说明资金愿意进场了。',
    impact: '短线参与股市的人会感觉赚钱效应变好；券商从业者业绩压力小一些。',
    category: 'stock',
    sourceName: '新浪财经',
    sourceUrl: 'https://finance.sina.com.cn',
    publishedAt: today.hour(10).toISOString()
  },
  {
    id: 'a003',
    title: '美联储官员集体放鸽，市场下调年内降息次数预期',
    summary:
      '美联储的几位大佬最近讲话偏"温柔"，暗示不着急降息。市场原本赌今年降 3 次，现在只赌 2 次了。降息少，意味着美元更值钱一点。',
    whyImportant: '美联储是全球资金的水龙头，它的态度直接影响全球股市、黄金、汇率的走向。',
    impact: '持有黄金和美股基金的人要留意波动；出国留学旅游换美元会稍贵。',
    category: 'global',
    sourceName: '新浪财经',
    sourceUrl: 'https://finance.sina.com.cn',
    publishedAt: today.hour(8).toISOString()
  },
  {
    id: 'a004',
    title: '多家云厂商宣布大模型 API 降价，最高降幅超 50%',
    summary:
      '提供 AI 大脑（大模型）的几家公司开始打价格战，调用价格最高便宜了一半多。就像水电费降价，用 AI 做产品的公司成本直接砍半。',
    whyImportant: 'AI 成本下降会加速 AI 在各行各业的普及，类似当年智能手机降价后 APP 爆发的逻辑。',
    impact: '创业者做 AI 应用更便宜了；相关云计算公司短期利润承压，但长期蛋糕变大。',
    category: 'tech',
    sourceName: '新浪财经',
    sourceUrl: 'https://finance.sina.com.cn',
    publishedAt: today.hour(11).toISOString()
  },
  {
    id: 'a005',
    title: '多部门发文推进消费品以旧换新，地方补贴细则陆续落地',
    summary:
      '国家鼓励大家把旧家电、旧车换成新的，中央和地方一起发补贴。比如旧的以旧换新买新冰箱，可能直接便宜几百到上千元。',
    whyImportant: '这是真金白银的刺激政策，既帮老百姓省钱，又帮工厂卖货，一箭双雕。',
    impact: '最近想换家电、买车的家庭可以关注当地补贴；家电汽车行业订单有望增加。',
    category: 'policy',
    sourceName: '新浪财经',
    sourceUrl: 'https://finance.sina.com.cn',
    publishedAt: today.hour(9).add(10, 'minute').toISOString()
  },
  {
    id: 'a006',
    title: '10 月 CPI 同比上涨 0.3%，物价总体平稳',
    summary:
      'CPI 可以理解为"过日子成本指数"。10 月比去年同期只贵了 0.3%，基本没怎么涨，菜价肉价都很平稳，钱包压力不大。',
    whyImportant: '物价太低也反映需求不足，这个数据给央行留出了继续宽松（降息降准）的空间。',
    impact: '存款利率短期可能维持低位；对按揭族来说，房贷利率下调的期望还在。',
    category: 'macro',
    sourceName: '新浪财经',
    sourceUrl: 'https://finance.sina.com.cn',
    publishedAt: today.hour(9).add(30, 'minute').toISOString()
  },
  {
    id: 'a007',
    title: '北向资金今日净买入超 80 亿元，重点加仓白酒与银行',
    summary:
      '北向资金就是从香港买 A 股的外资。今天外资净买了 80 多亿，主要买了白酒和银行这些"压舱石"资产，说明外资对中国核心资产有信心。',
    whyImportant: '外资是 A 股重要增量资金，它的流向往往领先于市场风格切换。',
    impact: '跟着外资动向做中长线配置的投资者可参考；持有消费基金的股民心情会好一点。',
    category: 'stock',
    sourceName: '新浪财经',
    sourceUrl: 'https://finance.sina.com.cn',
    publishedAt: today.hour(15).toISOString()
  },
  {
    id: 'a008',
    title: '国际油价窄幅震荡，布伦特原油徘徊在 82 美元附近',
    summary:
      '最近国际油价就像在走钢丝，一直在 82 美元附近小幅晃悠，没大涨也没大跌，因为产油国减产和需求疲软两股力量在拔河。',
    whyImportant: '油价影响通胀，也影响很多国家的政策选择，它是全球经济的风向标之一。',
    impact: '开车的朋友油价暂时稳了；化工、航空等用油大户的成本预期也稳了。',
    category: 'global',
    sourceName: '新浪财经',
    sourceUrl: 'https://finance.sina.com.cn',
    publishedAt: today.hour(7).toISOString()
  },
  {
    id: 'a009',
    title: '某头部手机厂商发布 AI 手机新品，预售量同比翻倍',
    summary:
      '手机圈又开始卷 AI 了，新手机内置大模型助手，能帮你修图、写文案。预售量比上一代翻了一倍，说明大家换手机的意愿被 AI 点燃了。',
    whyImportant: 'AI 手机可能带动一波换机潮，拉长来看会带动整个消费电子产业链复苏。',
    impact: '想换手机的不妨等等更多 AI 机型；电子行业从业者订单可能变多。',
    category: 'tech',
    sourceName: '新浪财经',
    sourceUrl: 'https://finance.sina.com.cn',
    publishedAt: today.hour(12).toISOString()
  },
  {
    id: 'a010',
    title: '多地调整公积金政策：提高贷款额度、支持付首付',
    summary:
      '好几个城市把公积金的用法放宽了：能借的钱变多了，有的还允许直接拿公积金付首付。买房用公积金更划算了。',
    whyImportant: '公积金政策是楼市政策的风向标，放宽说明地方在持续给购房需求松绑。',
    impact: '刚需买房家庭月供压力变小；房地产销售链条可能迎来小幅回暖。',
    category: 'policy',
    sourceName: '新浪财经',
    sourceUrl: 'https://finance.sina.com.cn',
    publishedAt: today.hour(10).add(20, 'minute').toISOString()
  },
  {
    id: 'a011',
    title: '制造业 PMI 连续两月站上荣枯线，中小企业景气回升',
    summary:
      'PMI 可以理解为"工厂景气度打分"，50 分是及格线。连续两个月超过 50，说明工厂的日子好起来了，尤其小厂订单明显变多。',
    whyImportant: '制造业是就业大盘，工厂景气了，打工人的就业和工资才有支撑。',
    impact: '制造业从业者年终奖预期变好；顺周期板块（机械、化工）受资金关注。',
    category: 'macro',
    sourceName: '新浪财经',
    sourceUrl: 'https://finance.sina.com.cn',
    publishedAt: today.subtract(1, 'day').hour(9).toISOString()
  },
  {
    id: 'a012',
    title: '国际金价创阶段新高，现货黄金站上 2400 美元',
    summary:
      '黄金又涨了，一盎司突破 2400 美元，创了近期新高。各国央行持续买金 + 市场赌美联储降息，两大买家在托底金价。',
    whyImportant: '金价创新高反映全球资金在找避险的地方，也是对纸币信心的一种投票。',
    impact: '买了黄金积存、金饰的居民资产增值；想追高买金的需要掂量波动风险。',
    category: 'global',
    sourceName: '新浪财经',
    sourceUrl: 'https://finance.sina.com.cn',
    publishedAt: today.subtract(1, 'day').hour(14).toISOString()
  }
]

// Mock：getArticles 云函数（H5 预览用），支持板块过滤 + 分页
export default function getArticles(data?: {
  category?: string
  page?: number
  pageSize?: number
}): ArticlePage {
  const category = data?.category
  const page = data?.page ?? 1
  const pageSize = data?.pageSize ?? 10

  let list: Article[] = MOCK_ARTICLES
  if (category && category !== 'all') {
    list = MOCK_ARTICLES.filter((a) => a.category === (category as CategoryKey))
  }

  const start = (page - 1) * pageSize
  const paged = list.slice(start, start + pageSize)

  return {
    list: paged,
    hasMore: start + pageSize < list.length
  }
}
