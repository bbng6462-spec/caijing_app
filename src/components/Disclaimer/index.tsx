import React from 'react'
import { View, Text } from '@tarojs/components'
import { DISCLAIMER_TEXT } from '../../types/finance'
import styles from './index.module.scss'

interface DisclaimerProps {
  text?: string
}

/** 免责声明条 */
const Disclaimer: React.FC<DisclaimerProps> = ({ text }) => {
  return (
    <View className={styles.wrap}>
      <Text className={styles.text}>{text || DISCLAIMER_TEXT}</Text>
    </View>
  )
}

export default Disclaimer
