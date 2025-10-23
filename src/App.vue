<script setup lang="ts">
import { ref, computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import AppHeader from './components/AppHeader.vue';
import AppSidebar from './components/AppSidebar.vue';
import SettingsModal from './components/SettingsModal.vue';
import ConsentBanner from './components/ConsentBanner.vue';

const route = useRoute();
const showLayout = computed(() => route.name !== 'signin');
const isSettingsModalOpen = ref(false);

const openSettingsModal = () => {
  isSettingsModalOpen.value = true;
};

const closeSettingsModal = () => {
  isSettingsModalOpen.value = false;
};

const handleConsent = (consent: boolean) => {
  const consentMode = {
    'functionality_storage': consent ? 'granted' : 'denied',
    'security_storage': consent ? 'granted' : 'denied',
    'analytics_storage': consent ? 'granted' : 'denied',
    'personalization_storage': consent ? 'granted' : 'denied',
  };
  gtag('consent', 'update', consentMode);
  localStorage.setItem('consentMode', JSON.stringify(consentMode));
};
</script>

<template>
  <div id="app-container" :class="{ 'full-page': !showLayout }">
    <template v-if="showLayout">
      <AppHeader @open-settings="openSettingsModal" />
      <div class="app-body">
        <AppSidebar />
        <div class="main-content">
          <main class="app-main">
            <RouterView />
          </main>
        </div>
      </div>
      <SettingsModal v-if="isSettingsModalOpen" @close="closeSettingsModal" />
      <ConsentBanner @consent-given="handleConsent" />
    </template>
    <template v-else>
      <RouterView />
    </template>
  </div>
</template>

<style>
/* Global Resets and Base Styles */
:root {
  --primary-color: #00c6ff;
  --secondary-color: #0072ff;
  --background-color: #121212;
  --surface-color: #1e1e1e;
  --text-color: #ffffff;
  --text-color-muted: #a0a0a0;
  --border-color: #2c2c2c;
  --font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

body {
  margin: 0;
  font-family: var(--font-family);
  background-color: var(--background-color);
  color: var(--text-color);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-body {
  display: flex;
  flex-grow: 1;
  overflow: hidden;
}

#app-container.full-page {
  display: block;
}

.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex-grow: 1;
  padding: 2rem;
  overflow-y: auto;
}
</style>
