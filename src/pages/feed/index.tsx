import React, { useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { usePullDownRefresh, useReachBottom, useDidShow } from '@tarojs/taro'
import { fetchArticles } from '@/services/finance'
import { Article, ArticlePage, CATEGORIES, CategoryKey, PREF_STORAGE_KEY } from '@/types/finance'
import NewsCard from '@/components/NewsCard'
import Disclaimer from '@/components/Disclaimer'
import EmptyState from '@/components/EmptyState'
import styles from './index.module.scss'

const PAGE_SIZE = 10

type TabKey = 'all' | CategoryKey

/** 初始 tab：若用户设置过板块偏好，则默认打开第一个偏好板块 */
function getInitialTab(): TabKey {
  try {
    const prefs = Taro.getStorageSync(PREF_STORAGE_KEY)
    if (Array.isArray(prefs) && prefs.length > 0 && prefs[0]) {
      return prefs[0] as TabKey
    }
  } catch (err) {
    console.error('[Feed] read preferences failed:', err)
  }
  return 'all'
}

/** 资讯流：板块 Tab + 解读卡片列表 */
const FeedPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>(getInitialTab)
  const [initialTab] = useState<TabKey>(getInitialTab)
  const [articles, setArticles] = useState<Article[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initialLoaded, setInitialLoaded] = useState(false)

  const loadArticles = (tab: TabKey, nextPage: number, append: boolean) => {
    if (loading) return
    setLoading(true)
    fetchArticles({
      category: tab === 'all' ? undefined : tab,
      page: nextPage,
      pageSize: PAGE_SIZE
    })
      .then((res: ArticlePage) => {
        console.log(`[Feed] loaded page ${nextPage}, got ${res.list.length} articles`)
        setArticles((prev) => (append ? [...prev, ...res.list] : res.list))
        setHasMore(res.hasMore)
        setPage(nextPage)
      })
      .catch((err) => {
        console.error('[Feed] load articles failed:', err)
        Taro.showToast({ title: '加载失败', icon: 'none' })
      })
      .finally(() => {
        setLoading(false)
        setInitialLoaded(true)
      })
  }

  // 首次加载（默认打开用户偏好的板块）
  React.useEffect(() => {
    loadArticles(initialTab, 1, false)
  }, [])

  // 早报页点击板块 → 自动切换到对应 tab
  useDidShow(() => {
    try {
      const pending = Taro.getStorageSync('feed_category')
      if (pending) {
        Taro.removeStorageSync('feed_category')
        if (pending !== activeTab) {
          setActiveTab(pending as TabKey)
          loadArticles(pending as TabKey, 1, false)
        }
      }
    } catch (err) {
      console.error('[Feed] read pending category failed:', err)
    }
  })

  const switchTab = (tab: TabKey) => {
    if (tab === activeTab) return
    setActiveTab(tab)
    loadArticles(tab, 1, false)
  }

  usePullDownRefresh(() => {
    loadArticles(activeTab, 1, false)
    Taro.stopPullDownRefresh()
  })

  useReachBottom(() => {
    if (hasMore && !loading) {
      loadArticles(activeTab, page + 1, true)
    }
  })

  const openDetail = (article: Article) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${article.id}` })
  }

  const tabs: { key: TabKey; name: string }[] = [
    { key: 'all', name: '全部' },
    ...CATEGORIES.map((c) => ({ key: c.key as TabKey, name: c.name }))
  ]

  return (
    <View className={styles.container}>
      <View className={styles.tabBar}>
        <ScrollView scrollX enhanced showScrollbar={false}>
          {tabs.map((t) => (
            <Text
              key={t.key}
              className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
              onClick={() => switchTab(t.key)}
            >
              {t.name}
            </Text>
          ))}
        </ScrollView>
      </View>

      <View className={styles.list}>
        {articles.map((a) => (
          <NewsCard key={a.id} article={a} onClick={openDetail} />
        ))}
      </View>

      {initialLoaded && articles.length === 0 && (
        <EmptyState emoji='🗒️' text='这个板块今天还没有解读，稍后再来看看' />
      )}

      {loading && <View className={styles.loadingMore}><Text>加载中...</Text></View>}
      {!loading && !hasMore && articles.length > 0 && (
        <View className={styles.loadingMore}><Text>- 到底啦 -</Text></View>
      )}

      <Disclaimer />
    </View>
  )
}

export default FeedPage
