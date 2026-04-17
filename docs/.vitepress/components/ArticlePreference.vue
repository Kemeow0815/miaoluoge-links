<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { authorMap, avatarMap, sizeMap, useArticleStore } from '../stores/article'
import articlesData from '../data/articles.json'

const { preference } = storeToRefs(useArticleStore())

// 随机跳转文章
function randomArticle() {
  const articles = articlesData.articles || []
  if (articles.length === 0) return

  const randomIndex = Math.floor(Math.random() * articles.length)
  const article = articles[randomIndex]

  if (article?.link) {
    window.open(article.link, '_blank')
  }
}
</script>

<template>
<form>
	<label for="author">来源展示</label>
	<select id="author" v-model="preference.author">
		<option v-for="(author, key) in authorMap" :key :value="key">
			{{ author.label }}
		</option>
	</select>

	<label for="avatar">头像展示</label>
	<select id="avatar" v-model="preference.avatar">
		<option v-for="(avatar, key) in avatarMap" :key :value="key">
			{{ avatar.label }}
		</option>
	</select>

	<label for="size">卡片尺寸</label>
	<select id="size" v-model="preference.size">
		<option v-for="(size, key) in sizeMap" :key :value="key">
			{{ size.label }}
		</option>
	</select>

	<label for="wide">宽屏</label>
	<input id="wide" v-model="preference.wide" type="checkbox">

	<label></label>
	<button type="button" class="random-btn" @click="randomArticle">
		🎲 随机文章
	</button>
</form>
</template>

<style scoped>
form {
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 0.5rem 1rem;
	padding: 0.5rem;
	text-align: left;
}

.random-btn {
	padding: 0.4rem 0.8rem;
	border: 1px solid var(--vp-c-brand-1);
	border-radius: 0.4rem;
	background: var(--vp-c-brand-soft);
	color: var(--vp-c-brand-1);
	font-size: 0.875rem;
	cursor: pointer;
	transition: all 0.2s;
}

.random-btn:hover {
	background: var(--vp-c-brand-1);
	color: white;
}
</style>
