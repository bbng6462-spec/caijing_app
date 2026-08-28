import React, { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { fetchLogin } from '@/services/finance'
import { CATEGORIES, CategoryKey, DISCLAIMER_TEXT, PREF_STORAGE_KEY } from '@/types/finance'
import Disclaimer from '@/components/Disclaimer'
import styles from './index.module.scss'

/** 我的页：用户信息 + 板块偏好 + 免责声明 */
const MinePage: React.FC = () => {
  const [openid, setOpenid] = useState('')
  const [prefs, setPrefs] = useState<CategoryKey[]>([])

  useEffect(() => {
    // 读取本地偏好
    try {
      const saved = Taro.getStorageSync(PREF_STORAGE_KEY)
      if (Array.isArray(saved) && saved.length > 0) {
        setPrefs(saved)
      }
    } catch (err) {
      console.error('[Mine] read preferences failed:', err)
    }

    // 获取 openid（H5 预览走 mock）
    fetchLogin()
      .then((res) => {
        console.log('[Mine] login ok:', res.openid)
        setOpenid(res.openid)
      })
      .catch((err) => console.error('[Mine] login failed:', err))
  }, [])

  const togglePref = (key: CategoryKey) => {
    const next = prefs.includes(key) ? prefs.filter((k) => k !== key) : [...prefs, key]
    setPrefs(next)
    try {
      Taro.setStorageSync(PREF_STORAGE_KEY, next)
    } catch (err) {
      console.error('[Mine] save preferences failed:', err)
    }
  }

  const showDisclaimer = () => {
    Taro.showModal({
      title: '免责声明',
      content: DISCLAIMER_TEXT,
      showCancel: false,
      confirmText: '我知道了'
    })
  }

  const showAbout = () => {
    Taro.showModal({
      title: '关于财经早知道',
      content:
        '每天早上 7 点，AI 自动整理各大财经频道的公开资讯，改写成大白话解读，按五大板块分类，帮你 3 分钟看懂财经大事。\n\n数据来源：新浪财经等公开渠道\n内容生成：DeepSeek AI',
      showCancel: false,
      confirmText: '好的'
    })
  }

  const maskedId = openid ? `ID：****${openid.slice(-6)}` : 'ID：获取中...'

  return (
    <View className={styles.container}>
      <View className={styles.userCard}>
        <View className={styles.avatar}>
          <Text className={styles.avatarEmoji}>📈</Text>
        </View>
        <View className={styles.userInfo}>
          <Text className={styles.userName}>财经学习者</Text>
          <Text className={styles.userId}>{maskedId}</Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>我的偏好板块</Text>
        <View className={styles.card}>
          <View className={styles.tagWrap}>
            {CATEGORIES.map((c) => (
              <Text
                key={c.key}
                className={classnames(styles.prefTag, prefs.includes(c.key) && styles.prefTagActive)}
                onClick={() => togglePref(c.key)}
              >
                {c.emoji} {c.name}
              </Text>
            ))}
          </View>
          <Text className={styles.prefTip}>
            {prefs.length > 0
              ? `已选 ${prefs.length} 个板块，早报会优先整理你关心的内容`
              : '选择你关心的板块，早报会优先整理相关内容'}
          </Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>更多</Text>
        <View className={styles.card}>
          <View className={styles.menuItem} onClick={showDisclaimer}>
            <Text className={styles.menuLabel}>免责声明</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={showAbout}>
            <Text className={styles.menuLabel}>关于与数据来源</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        </View>
      </View>

      <Disclaimer text='内容仅供参考学习，不构成投资建议 · 市场有风险，投资需谨慎' />
    </View>
  )
}

export default MinePage
