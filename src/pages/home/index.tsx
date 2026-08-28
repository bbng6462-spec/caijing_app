import React, { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import dayjs from 'dayjs'
import { fetchDailyReport } from '@/services/finance'
import { DailyReport, getCategoryInfo, CATEGORIES } from '@/types/finance'
import SectionTag from '@/components/SectionTag'
import Disclaimer from '@/components/Disclaimer'
import EmptyState from '@/components/EmptyState'
import styles from './index.module.scss'

const WEEK_MAP = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** 早报页：今日大势 + 五大板块要点 */
const HomePage: React.FC = () => {
  const [report, setReport] = useState<DailyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const loadReport = () => {
    setLoading(true)
    fetchDailyReport()
      .then((data) => {
        console.log('[Home] daily report loaded:', data.date)
        setReport(data)
        setLoadError(false)
      })
      .catch((err) => {
        console.error('[Home] load daily report failed:', err)
        setLoadError(true)
      })
      .finally(() => setLoading(false))
  }

  React.useEffect(() => {
    loadReport()
  }, [])

  usePullDownRefresh(() => {
    fetchDailyReport()
      .then((data) => {
        setReport(data)
        setLoadError(false)
      })
      .catch((err) => console.error('[Home] refresh failed:', err))
      .finally(() => Taro.stopPullDownRefresh())
  })

  /** 点击板块要点 → 跳资讯流对应板块（通过 storage 传参） */
  const goFeed = (categoryKey: string) => {
    Taro.setStorageSync('feed_category', categoryKey)
    Taro.switchTab({ url: '/pages/feed/index' })
  }

  const now = dayjs()
  const dateText = now.format('M月D日')
  const weekText = WEEK_MAP[now.day()]

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.dateRow}>
          <Text className={styles.dateText}>{dateText}</Text>
          <Text className={styles.weekText}>{weekText}</Text>
        </View>
        <View className={styles.brandRow}>
          <Text className={styles.brandName}>财经早知道 · AI 整理的大白话早报</Text>
        </View>
        {report && (
          <View className={styles.summaryCard}>
            <Text className={styles.summaryLabel}>今日大势</Text>
            <Text className={styles.summaryText}>{report.oneLineSummary}</Text>
          </View>
        )}
      </View>

      <Text className={styles.sectionTitle}>今日要点</Text>

      {loading && !report ? (
        <EmptyState emoji='⏳' text='早报生成中，请稍候...' />
      ) : loadError && !report ? (
        <EmptyState emoji='📡' text='早报加载失败，下拉重试' />
      ) : report ? (
        <View className={styles.highlightList}>
          {report.highlights.map((h) => {
            const info = getCategoryInfo(h.category)
            return (
              <View
                key={h.category}
                className={styles.highlightCard}
                onClick={() => goFeed(h.category)}
              >
                <View className={styles.highlightBody}>
                  <SectionTag category={info.key} />
                  <Text className={styles.highlightHeadline}>{h.headline}</Text>
                  <Text className={styles.highlightMeta}>
                    今日 {h.count} 条解读
                  </Text>
                </View>
                <Text className={styles.arrow}>›</Text>
              </View>
            )
          })}
          {report.highlights.length === 0 && (
            <EmptyState emoji='☀️' text='今日要点待生成，明天 7 点见' />
          )}
        </View>
      ) : null}

      <Disclaimer />
    </View>
  )
}

export default HomePage
