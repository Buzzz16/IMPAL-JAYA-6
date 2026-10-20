<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <svg
    width="25"
    height="25"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'exercise'">
      <circle cx="15" cy="4" r="2" />
      <path d="m12 8 5 4 4-1M4 11l5-3 4 3-3 5-5 5m5-5 6 1 2 4" />
    </template>
    <template v-else-if="name === 'window'">
      <path d="M3 3h18v18H3ZM12 3v18M3 12h18" />
      <path d="m6 6 3 3m6 6 3 3" />
    </template>
    <template v-else-if="name === 'mask'">
      <path d="m5 8 7-3 7 3v8l-7 4-7-4ZM5 9H2v6h3m14-6h3v6h-3M8 10h8m-8 4h8" />
    </template>
    <template v-else-if="name === 'purifier'">
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M8 7h8m-8 4h8m-8 4h8m-8 3h2" />
    </template>
    <template v-else-if="name === 'monitor'">
      <path d="M3 4h18v14H3Zm5 17h8m-4-3v3M6 13l3-4 4 3 4-5" />
    </template>
    <template v-else-if="name === 'user'">
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
    </template>
  </svg>
</template>
