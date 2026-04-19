<script setup lang="ts">
import type { Member } from '../utils/member'
import { Icon } from '@iconify/vue'
import { getDomain } from '../utils/link'
import { getAvatarUrl } from '../utils/member'
import { ref } from 'vue'

defineProps<Member>()

const imageError = ref<Record<string, boolean>>({})

function handleImageError(key: string) {
  imageError.value[key] = true
}
</script>

<template>
<a :href="website" target="_blank" class="card" rel="noopener noreferrer">
	<!-- 网站截图 -->
	<div class="screenshot" v-if="screenshot && !imageError[screenshot]">
		<img
			:src="screenshot"
			:alt="`${name} 的网站截图`"
			loading="lazy"
			referrerpolicy="no-referrer"
			@error="handleImageError(screenshot)"
		>
	</div>
	<!-- 网站信息 -->
	<div class="content">
		<img
			class="avatar"
			:src="getAvatarUrl({ avatarType, avatar })"
			:alt="`${name} 的头像`"
			loading="lazy"
		>
		<div class="info">
			<div class="name-line">
				<strong class="name">{{ name }}</strong>
				<span class="title">{{ title }}</span>
			</div>
			<p class="desc">{{ desc }}</p>
		</div>
	</div>
	<!-- GitHub 链接 -->
	<a
		v-if="github"
		class="github"
		:href="`https://github.com/${github}`"
		target="_blank"
		:title="github"
		@click.stop
	>
		<Icon icon="ri:github-fill" />
	</a>
</a>
</template>

<style scoped>
.card {
	position: relative;
	display: flex;
	flex-direction: column;
	text-decoration: none;
	color: inherit;
	overflow: hidden;
	border-radius: 0.5rem;
	background-color: var(--vp-c-bg-soft);
	transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 截图区域 */
.screenshot {
	width: 100%;
	aspect-ratio: 16 / 9;
	overflow: hidden;
	background: var(--vp-c-bg-alt);
}

.screenshot img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover .screenshot img {
	transform: scale(1.05);
}

/* 内容区域 */
.content {
	display: flex;
	gap: 0.8rem;
	padding: 0.8rem;
	align-items: flex-start;
}

.avatar {
	width: 2.5rem;
	height: 2.5rem;
	border-radius: 50%;
	flex-shrink: 0;
	object-fit: cover;
	transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover .avatar {
	transform: scale(1.05) rotate(4deg);
}

.info {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 0.3rem;
}

.name-line {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	flex-wrap: wrap;
}

.name {
	font-weight: 600;
	font-size: 0.95rem;
	color: var(--vp-c-text-1);
	transition: color 0.3s ease;
}

.card:hover .name {
	color: var(--vp-c-brand);
}

.title {
	font-size: 0.75rem;
	color: var(--vp-c-text-2);
	background: var(--vp-c-bg-alt);
	padding: 0.1rem 0.4rem;
	border-radius: 0.25rem;
}

.desc {
	margin: 0;
	font-size: 0.8rem;
	line-height: 1.5;
	color: var(--vp-c-text-2);
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

/* GitHub 链接 */
.github {
	position: absolute;
	top: 0.5rem;
	right: 0.5rem;
	width: 2rem;
	height: 2rem;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(4px);
	border-radius: 50%;
	color: white;
	opacity: 0;
	transition: opacity 0.3s ease;
	text-decoration: none;
}

.card:hover .github {
	opacity: 1;
}

.github:hover {
	background: rgba(0, 0, 0, 0.7);
}
</style>
