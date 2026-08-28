import React from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'

interface EmptyStateProps {
  emoji?: string
  text?: string
}

/** 空状态提示 */
const EmptyState: React.FC<EmptyStateProps> = ({ emoji = '📭', text = '暂无内容' }) => {
  return (
    <View className={styles.wrap}>
      <Text className={styles.emoji}>{emoji}</Text>
      <Text className={styles.text}>{text}</Text>
    </View>
  )
}

export default EmptyState
