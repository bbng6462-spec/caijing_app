import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import { CategoryKey, getCategoryInfo } from '../../types/finance'
import styles from './index.module.scss'

interface SectionTagProps {
  category: CategoryKey
  size?: 'sm' | 'md'
  className?: string
}

/** 板块标签：emoji + 板块名，胶囊样式 */
const SectionTag: React.FC<SectionTagProps> = ({ category, size = 'sm', className }) => {
  const info = getCategoryInfo(category)
  return (
    <View className={classnames(styles.tag, styles[size], className)}>
      <Text className={styles.emoji}>{info.emoji}</Text>
      <Text className={styles.name}>{info.name}</Text>
    </View>
  )
}

export default SectionTag
