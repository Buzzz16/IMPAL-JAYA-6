<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: [Number, String],
    default: 22,
  },
});
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'home'">
      <path d="m3 10 9-7 9 7v11H3Z" />
      <path d="M9 21v-8h6v8" />
    </template>
    <template v-else-if="name === 'user'">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
    </template>
    <template v-else-if="name === 'book'">
      <path d="M3 4h7l2 2 2-2h7v16h-7l-2 1-2-1H3Z" />
      <path d="M12 6v15M6 9h3m-3 4h3m6-4h3m-3 4h3" />
    </template>
    <template v-else-if="name === 'pin'">
      <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2" />
    </template>
    <template v-else-if="name === 'arrow'">
      <path d="M5 19 19 5M5 5h14v14" />
    </template>
    <template v-else-if="name === 'bell'">
      <path d="M5 17h14l-2-3V9A5 5 0 0 0 7 9v5ZM10 21h4" />
    </template>
    <template v-else-if="name === 'sun'">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" />
    </template>
    <template v-else-if="name === 'shield'">
      <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z" />
      <path d="m8 12 3 3 5-6" />
    </template>
    <template v-else-if="name === 'mask'">
      <path d="m5 8 7-3 7 3v8l-7 4-7-4ZM5 9H2v6h3m14-6h3v6h-3M8 10h8m-8 4h8" />
    </template>
    <template v-else-if="name === 'leaf'">
      <path d="M20 3C5 1 1 11 7 17s16 2 13-14Z" />
      <path d="M3 21 16 8" />
    </template>
    <template v-else-if="name === 'clock'">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v6l4 2" />
    </template>
    <template v-else-if="name === 'close'">
      <path d="m6 6 12 12M6 18 18 6" />
    </template>
    <template v-else-if="name === 'chevron'">
      <path d="m8 10 4 4 4-4" />
    </template>
    <template v-else-if="name === 'check'">
      <path d="m5 12 4 4 10-10" />
    </template>
    <template v-else>
      <path d="M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h6a3 3 0 1 1-3 3" />
    </template>
  </svg>
</template>
