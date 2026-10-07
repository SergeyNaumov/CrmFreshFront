<template>
  <!-- Глобальный лайтбокс для изображений. Открывается через шину:
       bus.$emit('lightbox:open', {src, alt}) или просто строкой-src.
       Рендерится в body, чтобы не зависеть от трансформаций/overflow лэйаута. -->
  <Teleport to="body">
    <transition name="lb-fade">
      <div v-if="open" class="lb" @click.self="close">
        <button class="lb-close" type="button" aria-label="Закрыть" @click.stop="close">
          <v-icon size="22" color="white">fa fa-times</v-icon>
        </button>
        <figure class="lb-figure" @click.stop>
          <img
            v-if="src"
            :src="src"
            :alt="alt"
            class="lb-img"
            :class="{ 'lb-img--zoom': zoom }"
            @click="toggle_zoom"
          >
          <figcaption v-if="alt" class="lb-caption">{{ alt }}</figcaption>
        </figure>
      </div>
    </transition>
  </Teleport>
</template>

<script>
import { bus } from '../main'

export default {
  name: 'lightbox',
  data() {
    return {
      open: false,
      src: '',
      alt: '',
      zoom: false
    }
  },
  mounted() {
    bus.$on('lightbox:open', this.open_event)
    document.addEventListener('keydown', this.on_keydown)
  },
  beforeUnmount() {
    bus.$off('lightbox:open', this.open_event)
    document.removeEventListener('keydown', this.on_keydown)
  },
  methods: {
    open_event(payload) {
      if (!payload) return
      if (typeof payload === 'string') {
        this.src = payload
        this.alt = ''
      } else {
        this.src = payload.src || ''
        this.alt = payload.alt || ''
      }
      if (!this.src) return
      this.zoom = false
      this.open = true
    },
    close() {
      this.open = false
      this.zoom = false
    },
    toggle_zoom() {
      this.zoom = !this.zoom
    },
    on_keydown(e) {
      if (e.key === 'Escape' && this.open) this.close()
    }
  }
}
</script>

<style scoped>
.lb {
  position: fixed;
  inset: 0;
  z-index: 30000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4vh 4vw;
  background: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(3px);
}
.lb-figure {
  margin: 0;
  max-width: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.lb-img {
  max-width: 92vw;
  max-height: 82vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55);
  cursor: zoom-in;
  transition: transform 0.22s ease;
}
.lb-img--zoom {
  transform: scale(1.7);
  cursor: zoom-out;
}
.lb-caption {
  margin-top: 12px;
  padding: 6px 14px;
  max-width: 90vw;
  color: #fff;
  font-size: 14px;
  text-align: center;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 20px;
}
.lb-close {
  position: absolute;
  top: 18px;
  right: 20px;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  cursor: pointer;
  transition: background 0.15s ease;
}
.lb-close:hover {
  background: rgba(255, 255, 255, 0.3);
}
.lb-fade-enter-active,
.lb-fade-leave-active {
  transition: opacity 0.18s ease;
}
.lb-fade-enter-from,
.lb-fade-leave-to {
  opacity: 0;
}
</style>
