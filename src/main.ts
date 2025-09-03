import './assets/main.css';

import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { loadConfig } from './stores/config';
import { initializeUserProfile } from './stores/user';

// Initialize stores from localStorage before mounting the app
initializeUserProfile();
loadConfig();

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');
