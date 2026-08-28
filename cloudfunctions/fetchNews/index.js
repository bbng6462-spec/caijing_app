// ============================================
// fetchNews: 定时抓取免费财经资讯 → DeepSeek 大白话解读 → 写入 articles → 生成每日早报
// 触发：云函数定时触发器（见 config.json），也可手动调用
// 环境变量：DEEPSEEK_API_KEY（在云开发控制台为该云函数配置，切勿写死在代码里）
// ============================================
const https = require('https')
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'
const DEEPSEEK_MODEL = 'deepseek-chat'
const MAX_PER_RUN = 12 // 每次最多解读的文章数，控制 API 消耗

const VALID_CATEGORIES = ['macro', 'stock', 'global', 'tech', 'policy']

// 免费公开信源（国内可直连）
const SOURCES = [
    {
        type: 'sina_roll',
        url: 'https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2516&num=50&page=1',
        sourceName: '新浪财经'
    },
    { type: 'rss', url: 'https://36kr.com/feed', sourceName: '36氪' },
    { type: 'rss', url: 'https://dedicated.wallstreetcn.com/rss.xml', sourceName: '华尔街见闻' }
]

// ---------- HTTP 工具（Node 内置 https，避免额外依赖） ----------
function request(url, options = {}) {
    return new Promise((resolve, reject) => {
        const u = new URL(url)
        const req = https.request(
            {
                hostname: u.hostname,
                path: u.pathname + u.search,
                method: options.method || 'GET',
                headers: Object.assign(
                    { 'Accept-Encoding': 'identity', 'User-Agent': 'Mozilla/5.0', Accept: '*/*' },
                    options.headers || {}
                ),
                timeout: 20000
            },
            (res) => {
                const chunks = []
                res.on('data', (c) => chunks.push(c))
                res.on('end', () => {
                    const body = Buffer.concat(chunks).toString('utf8')
                    if (res.statusCode >= 200 && res.statusCode < 300) resolve(body)
                    else reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 200)}`))
                })
            }
        )
        req.on('timeout', () => req.destroy(new Error('请求超时')))
        req.on('error', reject)
        if (options.body) req.write(options.body)
        req.end()
    })
}

// ---------- 抓取与解析 ----------
function parseSinaRoll(raw) {
    const json = JSON.parse(raw)
    const data = (json.result && json.result.data) || []
    return data
        .map((it) => ({
            title: String(it.title || '').trim(),
            url: it.url,
            publishedAt: new Date(Number(it.ctime) * 1000 || Date.now()).toISOString(),
            sourceName: it.media_name || '新浪财经'
        }))
        .filter((it) => it.title && it.url)
}

function extractTag(block, tag) {
    const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
    return m ? m[1] : ''
}

function decodeCdata(s) {
    const m = s.match(/<!\[CDATA\[([\s\S]*?)\]\]>/)
    return (m ? m[1] : s).trim()
}

function parseRss(xml, sourceName) {
    const blocks = xml.match(/<item[\s\S]*?<\/item>/g) || []
    const items = []
    for (const block of blocks) {
        const title = decodeCdata(extractTag(block, 'title')).replace(/<[^>]+>/g, '').trim()
        const link = decodeCdata(extractTag(block, 'link'))
        const pub = extractTag(block, 'pubDate').trim()
        const d = pub ? new Date(pub) : new Date()
        if (!title || !link) continue
        items.push({
            title,
            url: link,
            publishedAt: (isNaN(d.getTime()) ? new Date() : d).toISOString(),
            sourceName
        })
    }
    return items
}

async function fetchAllSources() {
    const results = await Promise.all(
        SOURCES.map(async (s) => {
            try {
                const body = await request(s.url)
                const items = s.type === 'sina_roll' ? parseSinaRoll(body) : parseRss(body, s.sourceName)
                console.log(`[fetchNews] ${s.sourceName}: ${items.length} items`)
                return items
            } catch (err) {
                console.error(`[fetchNews] source ${s.sourceName} failed:`, err.message)
                return [] // 单个信源失败不影响整体
            }
        })
    )
    return results.flat()
}

function dedupe(items) {
    const seen = new Set()
    return items.filter((it) => {
        const key = it.title.replace(/\s/g, '')
        if (!key || seen.has(key) || seen.has(it.url)) return false
        seen.add(key)
        seen.add(it.url)
        return true
    })
}

// ---------- DeepSeek 调用 ----------
function callDeepSeek(apiKey, systemPrompt, userPrompt, maxTokens) {
    const body = JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: maxTokens,
        stream: false
    })
    return request(DEEPSEEK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
        },
        body
    }).then((raw) => {
        const json = JSON.parse(raw)
        const content = json.choices && json.choices[0] && json.choices[0].message.content
        return JSON.parse(content)
    })
}

async function callDeepSeekWithRetry(apiKey, systemPrompt, userPrompt, maxTokens) {
    let lastErr
    for (let i = 0; i < 2; i++) {
        try {
            return await callDeepSeek(apiKey, systemPrompt, userPrompt, maxTokens)
        } catch (err) {
            lastErr = err
            console.error(`[fetchNews] deepseek call failed (attempt ${i + 1}):`, err.message)
        }
    }
    throw lastErr
}

const INTERPRET_SYSTEM =
    '你是财经科普作者，擅长把专业财经新闻改写成小白能听懂的大白话。' +
    '输出必须是 JSON 对象，字段：' +
    'category（只能取 macro/stock/global/tech/policy 之一，按新闻主要内容归类）、' +
    'summary（不超过80字，说清发生了什么）、' +
    'whyImportant（不超过60字，为什么重要）、' +
    'impact（不超过60字，会影响谁的钱包或生活，尽量具体）。' +
    '不要输出 JSON 以外的任何内容。'

async function interpretArticle(apiKey, item) {
    const ai = await callDeepSeekWithRetry(
        apiKey,
        INTERPRET_SYSTEM,
        `新闻标题：${item.title}\n来源：${item.sourceName}`,
        500
    )
    return {
        category: VALID_CATEGORIES.includes(ai.category) ? ai.category : 'macro',
        summary: String(ai.summary || '').trim() || '暂无解读',
        whyImportant: String(ai.whyImportant || '').trim() || '暂无解读',
        impact: String(ai.impact || '').trim() || '暂无解读'
    }
}

// ---------- 每日早报生成 ----------
const REPORT_SYSTEM =
    '你是财经早报编辑。根据今天已解读的文章列表，生成今日财经早报 JSON：' +
    'oneLineSummary（不超过50字，用大白话概括今天整体财经大势）、' +
    'highlights（数组，每个元素为 {category, headline}，category 只能取 macro/stock/global/tech/policy 之一' +
    '且必须是文章列表中出现过的板块，headline 不超过25字概括该板块今天最值得关注的看点）。' +
    '不要输出 JSON 以外的任何内容。'

async function generateDailyReport(apiKey) {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const res = await db
        .collection('articles')
        .where({ createdAt: _.gte(startOfDay.toISOString()) })
        .limit(50)
        .get()
    const todayArticles = res.data

    if (todayArticles.length === 0) {
        console.log('[fetchNews] no articles today, skip report')
        return null
    }

    const countMap = {}
    todayArticles.forEach((a) => {
        countMap[a.category] = (countMap[a.category] || 0) + 1
    })

    const compactList = todayArticles
        .slice(0, 30)
        .map((a) => ({ category: a.category, title: a.title }))

    const ai = await callDeepSeekWithRetry(apiKey, REPORT_SYSTEM, JSON.stringify(compactList), 500)

    const highlights = (Array.isArray(ai.highlights) ? ai.highlights : [])
        .filter((h) => VALID_CATEGORIES.includes(h.category) && countMap[h.category] > 0)
        .map((h) => ({
            category: h.category,
            headline: String(h.headline || '').slice(0, 30),
            count: countMap[h.category]
        }))

    const report = {
        date: todayStr(),
        oneLineSummary: String(ai.oneLineSummary || '').trim() || '今日财经动态已整理',
        highlights,
        articleCount: todayArticles.length,
        generatedAt: new Date().toISOString()
    }

    // upsert：当天已有早报则更新，否则新建
    const exist = await db.collection('daily_reports').where({ date: report.date }).limit(1).get()
    if (exist.data.length > 0) {
        await db.collection('daily_reports').doc(exist.data[0]._id).update({ data: report })
    } else {
        await db.collection('daily_reports').add({ data: report })
    }
    console.log(`[fetchNews] daily report saved for ${report.date}`)
    return report
}

function todayStr() {
    const d = new Date()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${m}-${day}`
}

// ---------- 主流程 ----------
exports.main = async () => {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
        return { code: -1, message: '未配置环境变量 DEEPSEEK_API_KEY，请在云开发控制台为 fetchNews 配置', data: null }
    }

    try {
        // 1. 抓取 + 批内去重
        const rawItems = await fetchAllSources()
        const items = dedupe(rawItems)
        console.log(`[fetchNews] fetched ${rawItems.length}, unique ${items.length}`)

        if (items.length === 0) {
            return { code: -1, message: '所有信源均抓取失败，请检查云函数网络', data: null }
        }

        // 2. 与库中已有文章去重（按 sourceUrl）
        const existRes = await db
            .collection('articles')
            .where({ sourceUrl: _.in(items.slice(0, 100).map((i) => i.url)) })
            .field({ sourceUrl: true })
            .limit(100)
            .get()
        const existUrls = new Set(existRes.data.map((d) => d.sourceUrl))
        const newItems = items.filter((it) => !existUrls.has(it.url))
        console.log(`[fetchNews] new articles: ${newItems.length}`)

        // 3. 逐条 DeepSeek 解读并入库（限流，控制成本）
        let saved = 0
        for (const item of newItems.slice(0, MAX_PER_RUN)) {
            try {
                const ai = await interpretArticle(apiKey, item)
                await db.collection('articles').add({
                    data: { ...item, ...ai, createdAt: new Date().toISOString() }
                })
                saved++
            } catch (err) {
                console.error(`[fetchNews] interpret failed for "${item.title}":`, err.message)
            }
        }
        console.log(`[fetchNews] saved ${saved} articles`)

        // 4. 生成/更新今日早报
        let report = null
        if (saved > 0) {
            try {
                report = await generateDailyReport(apiKey)
            } catch (err) {
                console.error('[fetchNews] generate report failed:', err.message)
            }
        }

        return {
            code: 0,
            message: 'success',
            data: { fetched: items.length, saved, reportSaved: !!report }
        }
    } catch (err) {
        console.error('[fetchNews] error:', err)
        return { code: -1, message: err.message || '抓取失败', data: null }
    }
}
