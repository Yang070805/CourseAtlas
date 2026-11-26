<script setup lang="ts">
import CustomCourseForm from '@/components/custom/CustomCourseForm.vue'
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1 class="page-title">自定义课程</h1>
        <p class="page-subtitle">
          课程库里没有的课（校外课程、重修课程、自学项目）可以从这里添加。提交时同样会进行时间冲突与学分上限校验。
        </p>
      </div>
    </div>

    <CustomCourseForm />
  </div>
</template>
