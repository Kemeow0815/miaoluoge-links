---
title: 克喵の友链屋
titleTemplate: KeMiaoHub
layout: home

hero:
  name: 克喵の友链屋
  text: KeMiao's Links Hub
  tagline:
  image:
    src: https://wsrv.nl/?url=github.com%2FKemeow0815.png
    alt: 克喵爱吃卤面
  actions:
    - link: /article
      text: 文章聚合
      theme: alt
---

<script setup>
import MemberList from '@/components/MemberList.vue'
</script>

<MemberList id="members" />

<style>
/* Hero 头像圆形样式 */
.VPHero .VPImage.image-src {
  border-radius: 50% !important;
  width: 200px !important;
  height: 200px !important;
  object-fit: cover !important;
}
</style>
