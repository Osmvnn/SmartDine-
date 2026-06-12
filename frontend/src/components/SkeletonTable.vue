<template>
  <div class="skeleton-table">
    <div class="skel-row skel-header">
      <div v-for="n in cols" :key="n" class="skel-cell skel-block" style="height: 12px;"></div>
    </div>
    <div v-for="r in rows" :key="r" class="skel-row">
      <div
        v-for="c in cols"
        :key="c"
        class="skel-cell skel-block"
        style="height: 14px;"
        :style="{ width: cellWidth(c) }"
      ></div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  rows: { type: Number, default: 5 },
  cols: { type: Number, default: 4 }
})

const widths = ['80%', '60%', '45%', '70%', '50%', '40%']
const cellWidth = (col) => widths[(col - 1) % widths.length]
</script>

<style scoped>
.skeleton-table { background: var(--dark-card, #1e293b); border-radius: 14px; padding: 16px; }
.skel-row { display: flex; gap: 16px; padding: 10px 0; border-bottom: 1px solid var(--dark-border, #1e293b); align-items: center; }
.skel-header .skel-block { height: 10px !important; background: var(--dark-border, #3d4f6b); }
.skel-cell { border-radius: 6px; flex: 1; min-height: 14px; }
.skel-block { background: var(--dark-hover, #334155); animation: shimmer 1.5s infinite; }
</style>
