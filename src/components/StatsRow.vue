<template>
  <div class="stats-row">
    <slot v-if="$slots.default" />
    <template v-else-if="stats && stats.length">
      <StatsCard
        v-for="(stat, index) in stats"
        :key="index"
        :icon="stat.icon"
        :value="stat.value"
        :label="stat.label"
        :trend="stat.trend"
        :trend-direction="stat.trendDirection"
        :loading="stat.loading"
        :variant="stat.variant || 'primary'"
        :format="stat.format"
      >
        <template v-if="stat.customValue" #value>
          <component :is="() => stat.customValue" />
        </template>
      </StatsCard>
    </template>
  </div>
</template>

<script setup>
import StatsCard from './StatsCard.vue'

defineProps({
  stats: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}
</style>