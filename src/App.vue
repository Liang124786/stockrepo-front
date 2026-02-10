<template>
  <AppNavbar />
  <main class="pt-16">
    <router-view :key="$route.fullPath" />
  </main>
</template>

<script setup>
import AppNavbar from './components/AppNavbar.vue'
</script>
