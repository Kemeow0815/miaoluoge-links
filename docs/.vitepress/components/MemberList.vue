<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import membersData from '../data/members.json'
import MemberCard from './MemberCard.vue'

const members = ref([...membersData])

const shuffleMembers = () => {
	members.value = [...members.value].sort(() => Math.random() - 0.5)
}

function modifyMembers() {
	const confirmMsg = '跳转github仓库提交议题表单。'
	// eslint-disable-next-line no-alert
	if (!window?.confirm(confirmMsg))
		return
	window.open('https://github.com/Kemeow0815/miaoluoge-links/issues/new?template=friend-link-request.yml')
}
</script>

<template>
<div>
	<h2>
		成员
		<Badge text="申请" style="cursor: pointer;" @click="modifyMembers" />
		<Icon class="shuffle-btn" icon="ri:shuffle-fill" @click="shuffleMembers" />
	</h2>
	<!-- 使用 ClientOnly 包裹，避免 SSR hydration mismatch -->
	<ClientOnly>
		<TransitionGroup tag="section" class="card-list" name="list">
			<MemberCard v-for="member in members" :key="member.github" v-bind="member" />
		</TransitionGroup>
		<template #fallback>
			<section class="card-list">
				<MemberCard v-for="member in membersData" :key="member.github" v-bind="member" />
			</section>
		</template>
	</ClientOnly>
</div>
</template>

<style scoped>
.list-move {
	transition: all 0.2s;
}

.shuffle-btn {
	float: right;
	cursor: pointer;
}

.card-list {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(15em, 1fr));
	gap: 0.8rem;
}

/* 手机端适配 */
@media screen and (max-width: 768px) {
	.card-list {
		grid-template-columns: 1fr;
	}
}

/* 平板端适配 */
@media screen and (min-width: 769px) and (max-width: 1024px) {
	.card-list {
		grid-template-columns: repeat(2, 1fr);
	}
}
</style>
