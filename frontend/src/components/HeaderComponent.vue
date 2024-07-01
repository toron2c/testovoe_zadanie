<script setup lang="ts">
import { ref, computed } from 'vue'
type Props = {
  fetchData: (query?: string) => Promise<void>
}
const props = defineProps<Props>()

const handleClick = () => {
  if (showTooltip.value && inputValue.value.length === 0) {
    props.fetchData()
  } else if (showTooltip.value) {
    return
  } else {
    props.fetchData(`?query=${inputValue.value}`)
  }
}
const inputValue = ref('')

const onInputChange = (e: Event) => {
  inputValue.value = (e.target as HTMLInputElement).value
}
const showTooltip = computed(() => inputValue.value.length < 3)
</script>

<template>
  <a-page-header title="Сделки" style="border: 2px solid rgb(235, 237, 240)">
    <template #extra>
      <a-tooltip :title="showTooltip ? 'Минимум 3 символа' : ''">
        <a-input
          v-model:value="inputValue"
          placeholder="Введите текст"
          style="width: 450px"
          @input="onInputChange"
          @keyup.enter="handleClick"
        />
      </a-tooltip>
      <a-button @click="handleClick">Искать</a-button>
    </template>
  </a-page-header>
</template>

<style scoped>
a-page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
