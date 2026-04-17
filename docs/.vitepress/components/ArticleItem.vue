<script setup lang="ts">
import type { Article } from '../utils/atricle'
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useArticleStore, authorMap, avatarMap } from '../stores/article'
import { getAvatarUrl, getMemberByFeed } from '../utils/member'
import { getDomain } from '../utils/link'
import AutoCode from './atomic/AutoCode.vue'

const props = defineProps<Article>()

const articleStore = useArticleStore()
const { preference } = storeToRefs(articleStore)

const dateLabel = new Date(props.date).toLocaleString('zh-CN', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

// 获取成员信息
const member = computed(() => {
  return getMemberByFeed(props.link)
})

// 根据偏好设置显示作者名
const authorName = computed(() => {
  const transform = authorMap[preference.value.author].transform
  if (transform && member.value) {
    const result = transform(member.value)
    if (result) return result
  }
  // 回退逻辑
  if (props.source?.name) {
    return props.source.name
  }
  return props.author
})

// 根据偏好设置显示头像
const authorAvatar = computed(() => {
  const transform = avatarMap[preference.value.avatar].transform
  if (transform && member.value) {
    const result = transform(member.value)
    if (result) return result
  }
  // 回退逻辑
  if (props.source?.avatar) {
    return getAvatarUrl({ avatarType: props.source.avatarType || 'github', avatar: props.source.avatar })
  }
  return undefined
})

// 是否显示头像
const showAvatar = computed(() => {
  return preference.value.avatar !== 'none' && authorAvatar.value
})
</script>

<template>
<a
	class="article-item"
	:href="link"
	target="_blank"
>
	<div class="title">{{ title }}</div>
	<AutoCode class="summary scrollcheck-y" tag="p" :text="summary" />
	<div class="info-line">
		<img v-if="showAvatar" :src="authorAvatar" :alt="authorName" class="avatar">
		<span class="author">{{ authorName }}</span> ·
		<time class="date" :datetime="date">
			{{ dateLabel }}
		</time>
	</div>
</a>
</template>

<style scoped>
.article-item.article-item {
	display: grid;
	grid-template-rows: auto 1fr auto;
	gap: 0.5rem;
	position: relative;
	overflow: hidden;
	max-height: 12rem;
	padding: 1rem;
	border-radius: 0.5rem;
	outline: 1px solid transparent;
	background: var(--vp-c-bg-soft);
	line-height: 1.4;
	color: var(--vp-c-text-1);
	z-index: 0;
}

.article-item:hover {
	outline-color: var(--vp-c-brand-1);
	background: none;
	color: var(--vp-c-brand-1);
}

.article-item.article-item.article-item.article-item::after {
	content: unset;
}

p.summary {
	--guessed-scrollbar-width: 0px;

	overflow: auto;
	opacity: 0.8;
	margin: 0;
	font-size: 0.8rem;
	scrollbar-width: none;
}

.info-line {
	font-size: 0.8rem;
	color: var(--vp-c-text-2);
}

.avatar {
	position: absolute;
	opacity: 0.2;
	right: 0.8rem;
	bottom: 0.5rem;
	height: 3rem;
	border-radius: 3rem;
	transition: opacity 0.2s;
	z-index: -1;
}

.article-item:hover .avatar {
	opacity: 0.5;
}
</style>
