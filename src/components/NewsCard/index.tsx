import React from 'react'
import { View, Text } from '@tarojs/components'
import { Article } from '../../types/finance'
import SectionTag from '../SectionTag'
import styles from './index.module.scss'

interface NewsCardProps {
  article: Article
  onClick: (article: Article) => void
}

/** 资讯流新闻解读卡片 */
const NewsCard: React.FC<NewsCardProps> = ({ article, onClick }) => {
  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${month}-${day} ${hours}:${minutes}`
  }

  return (
    <View
      className={styles.card}
      onClick={() => onClick(article)}
    >
      <View className={styles.header}>
        <SectionTag category={article.category} />
        <Text className={styles.time}>{formatTime(article.publishedAt)}</Text>
      </View>
      <Text className={styles.title}>{article.title}</Text>
      <Text className={styles.summary}>{article.summary}</Text>
      <View className={styles.footer}>
        <Text className={styles.source}>来源：{article.sourceName}</Text>
        <Text className={styles.more}>查看解读 ›</Text>
      </View>
    </View>
  )
}

export default NewsCard
