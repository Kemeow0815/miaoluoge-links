<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { Member } from '../utils/member'
import { getDomain } from '../utils/link'
import { getAvatarUrl } from '../utils/member'

defineProps<Member>()
</script>

<template>
<div class="card">
	<div class="title-line">
		<img
			class="avatar"
			:src="getAvatarUrl({ avatarType, avatar })"
			:alt="`${name} 的头像`"
		>
		<span>
			<div class="mask">{{ title }}</div>
			<strong>{{ name }}</strong>
		</span>
		<a class="github" hidden :href="`https://github.com/${github}`" target="_blank" :title="`${github}`">
			<Icon icon="ri:github-fill" />
		</a>
	</div>
	<p class="desc">
		{{ desc }}
	</p>
	<a class="website" hidden :href="website" target="_blank">
		{{ getDomain(website) }}
		<Icon icon="ri:arrow-right-line" />
	</a>
</div>
</template>

<style scoped>
.card {
	position: relative;
	overflow: hidden;
	overflow: clip;
	padding: 0.8rem;
	border-radius: 0.5rem;
	background-color: var(--vp-c-bg-soft);
}

.title-line {
	display: flex;
	align-items: center;
	gap: 0.8rem;
}

.avatar {
	width: 3rem;
	height: 3rem;
	margin: 0;
	border-radius: 3rem;
	object-fit: cover;
}

.mask {
	position: absolute;
	opacity: 0.6;
	margin-top: -1em;
	mask: linear-gradient(#FFF, transparent);
	font-size: 14px;
	font-weight: bold;
}

.card:hover .github {
	display: revert;
	position: absolute;
	right: 1rem;
	background: none;
	animation: fade-in 0.3s;
}

.desc {
	min-height: 1.5em;
	margin: 0.8rem 0 0;
	font-size: 13px;
	line-height: 1.5;
	color: var(--vp-c-text-2);
	transition: opacity 0.2s;
}

.card:hover .desc {
	opacity: 0;
}

.card:hover .website {
	display: flex;
	align-items: center;
	justify-content: center;
	position: absolute;
	inset: auto 0 0;
	height: 2em;
	text-align: center;
	animation: fade-in 0.3s;
}

@keyframes fade-in {
	from { opacity: 0; }
	to { opacity: 1; }
}
</style>
