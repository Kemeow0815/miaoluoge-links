<script setup lang="ts">
import type { Article } from '../utils/atricle'
import { Icon } from '@iconify/vue'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import articlesData from '../data/articles.json'
import { useArticleStore } from '../stores/article'
import ArticleItem from './ArticleItem.vue'
import ArticlePreference from './ArticlePreference.vue'

const { preference, size } = storeToRefs(useArticleStore())

// 每页显示数量
const PAGE_SIZE = 30

// 当前页码
const currentPage = ref(1)

// 从本地 JSON 获取文章
const allArticles = computed<Article[]>(() => {
	return articlesData.articles || []
})

// 总文章数
const total = computed(() => allArticles.value.length)

// 总页数
const totalPages = computed(() => Math.ceil(total.value / PAGE_SIZE))

// 当前页的文章
const articleList = computed(() => {
	const start = (currentPage.value - 1) * PAGE_SIZE
	const end = start + PAGE_SIZE
	return allArticles.value.slice(start, end)
})

// 是否有上一页
const hasPrevPage = computed(() => currentPage.value > 1)

// 是否有下一页
const hasNextPage = computed(() => currentPage.value < totalPages.value)

// 跳转到上一页
function prevPage() {
	if (hasPrevPage.value) {
		currentPage.value--
		scrollToTop()
	}
}

// 跳转到下一页
function nextPage() {
	if (hasNextPage.value) {
		currentPage.value++
		scrollToTop()
	}
}

// 跳转到指定页
function goToPage(page: number) {
	if (page >= 1 && page <= totalPages.value) {
		currentPage.value = page
		scrollToTop()
	}
}

// 滚动到顶部
function scrollToTop() {
	window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 格式化日期
function formatDate(dateStr: string) {
	const date = new Date(dateStr)
	return date.toLocaleDateString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	})
}
</script>

<template>
<h1>文章列表</h1>
<p class="stats vp-doc">
	<span>共 {{ total }} 篇文章</span>
	<span v-if="articlesData.lastUpdated">
		更新于 {{ formatDate(articlesData.lastUpdated) }}
	</span>

	<Dropdown title="偏好设置">
		<Icon icon="ri:list-settings-fill" class="cursor-pointer" width="20" />
		<template #content>
			<ArticlePreference />
		</template>
	</Dropdown>
</p>

<section class="article-list" :class="{ narrow: !preference.wide }" :style="{ '--size': size }">
	<ArticleItem v-for="item in articleList" :key="item._id" v-bind="item" />
</section>

<!-- 分页 -->
<div v-if="totalPages > 1" class="pagination">
	<button
		:disabled="!hasPrevPage"
		class="page-btn"
		@click="prevPage"
	>
		上一页
	</button>

	<div class="page-numbers">
		<button
			v-for="page in totalPages"
			:key="page"
			class="page-number" :class="[{ active: page === currentPage }]"
			@click="goToPage(page)"
		>
			{{ page }}
		</button>
	</div>

	<button
		:disabled="!hasNextPage"
		class="page-btn"
		@click="nextPage"
	>
		下一页
	</button>
</div>

<div class="page-info">
	第 {{ currentPage }} / {{ totalPages }} 页
</div>
</template>

<style scoped>
h1 {
  margin: 2em 0 2rem;
  font: revert;
  line-height: 1.4;
  text-align: center;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 1em;
  flex-wrap: wrap;
}

.article-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--size, 20rem), 1fr));
  gap: 1rem;
  margin: 2rem auto;
}

.article-list.narrow {
  max-width: 83rem;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0;
  flex-wrap: wrap;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 0.5rem;
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background-color: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.page-number {
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 0.5rem;
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: all 0.2s;
}

.page-number:hover {
  background-color: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
}

.page-number.active {
  background-color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: white;
}

.page-info {
  text-align: center;
  color: var(--vp-c-text-2);
  margin-bottom: 2rem;
}
</style>
