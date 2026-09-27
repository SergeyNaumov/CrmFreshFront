<template>
  <iframe v-if="src" class="src-iframe" :src="src"></iframe>
</template>
<script>
// Неизвестные пути: /src:<url> -> iframe внутри shell; иначе -> на главную.
export default {
  name: 'fallback-route',
  computed: {
    src() {
      const m = this.$route.fullPath.match(/^\/src:(.*)$/)
      return m ? m[1] : ''
    },
  },
  created() {
    if (!this.src) this.$router.replace('/')
  },
}
</script>
<style scoped>
.src-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
