import React, { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { fetchArticleDetail } from '@/services/finance'
import { Article } from '@/types/finance'
import SectionTag from '@/components/SectionTag'
import Disclaimer from '@/components/Disclaimer'
import EmptyState from '@/components/EmptyState'
import styles from './index.module.scss'

/** 解读详情页：三段式大白话解读 + 原文来源 */
const DetailPage: React.FC = () => {
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const id = router.params.id
    if (!id) {
      console.error('[Detail] missing id param')
      setError(true)
      setLoading(false)
      return
    }
    fetchArticleDetail(id)
      .then((data) => {
        console.log('[Detail] article loaded:', data.title)
        setArticle(data)
        Taro.setNavigationBarTitle({ title: '大白话解读' })
      })
      .catch((err) => {
        console.error('[Detail] load failed:', err)
        setError(true)
      })
      .finally(() => setLoading(false))
  }, [router.params.id])

  const copyLink = () => {
    if (!article || !article.sourceUrl) {
      Taro.showToast({ title: '暂无原文链接', icon: 'none' })
      return
    }
    Taro.setClipboardData({ data: article.sourceUrl })
  }

  if (loading) {
    return (
      <View className={styles.container}>
        <EmptyState emoji='⏳' text='解读加载中...' />
      </View>
    )
  }

  if (error || !article) {
    return (
      <View className={styles.container}>
        <EmptyState emoji='😕' text='解读不存在或已下线' />
      </View>
    )
  }

  const timeText = new Date(article.publishedAt).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <View className={styles.container}>
      <View className={styles.metaRow}>
        <SectionTag category={article.category} size='md' />
        <Text className={styles.metaTime}>{timeText}</Text>
      </View>
      <Text className={styles.title}>{article.title}</Text>

      <View className={styles.block}>
        <Text className={styles.blockLabel}>💬 大白话解读</Text>
        <Text className={styles.blockText}>{article.summary}</Text>
      </View>

      <View className={styles.block}>
        <Text className={styles.blockLabel}>❗ 为什么重要</Text>
        <Text className={styles.blockText}>{article.whyImportant}</Text>
      </View>

      <View className={styles.block}>
        <Text className={`${styles.blockLabel} ${styles.blockLabelGold}`}>🎯 影响谁</Text>
        <Text className={styles.blockText}>{article.impact}</Text>
      </View>

      <View className={styles.sourceCard}>
        <Text className={styles.sourceName}>原文来源：{article.sourceName}</Text>
        <Text className={styles.copyBtn} onClick={copyLink}>
          复制链接
        </Text>
      </View>

      <Disclaimer />
    </View>
  )
}

export default DetailPage
