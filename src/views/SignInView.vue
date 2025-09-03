<template>
  <div class="signin-view">
    <div class="signin-card">
      <img src="@/assets/BucketLocale-icon.png" alt="BucketLocale Logo" class="logo" />
      <h1 class="signin-title">Welcome to BucketLocale</h1>
      <p class="signin-subtitle">Please sign in to continue</p>

      <div v-if="!isClientIdAvailable" class="input-group">
        <input
          type="text"
          v-model="clientId"
          placeholder="Enter Google Client ID"
          :disabled="isClientIdSaved"
        />
        <button @click="handleSaveEdit" class="save-button">
          {{ isClientIdSaved ? 'Edit' : 'Save' }}
        </button>
      </div>

      <button
        id="google-signin-button"
        class="google-signin-btn"
        @click="handleSignIn"
        :disabled="isSignInDisabled"
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
          alt="Google logo"
        />
        Sign in with Google
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { initGoogleTokenClient, requestGoogleToken, type GoogleAccountsOAuth2 } from '../services/auth';
import { config, saveConfig, loadConfig } from '../stores/config';

const router = useRouter();
const clientId = ref('');
const isClientIdSaved = ref(false);

const isClientIdAvailable = computed(() => !!import.meta.env.VITE_GOOGLE_CLIENT_ID);

const isSignInDisabled = computed(() => {
  if (isClientIdAvailable.value) {
    return false;
  }
  return !isClientIdSaved.value;
});

const handleSaveEdit = () => {
  if (isClientIdSaved.value) {
    isClientIdSaved.value = false;
  } else {
    if (clientId.value) {
      saveConfig({ googleClientId: clientId.value });
      isClientIdSaved.value = true;
    } else {
      alert('Please enter a Client ID.');
    }
  }
};

const waitForGoogleSignIn = (callback: () => void) => {
  if (typeof (window as Window & typeof globalThis & { google?: { accounts: { oauth2: GoogleAccountsOAuth2 } } }).google !== 'undefined') {
    callback();
  } else {
    setTimeout(() => {
      waitForGoogleSignIn(callback);
    }, 100);
  }
};

const initGoogleSignIn = () => {
  waitForGoogleSignIn(() => {
    const finalClientId = isClientIdAvailable.value
      ? import.meta.env.VITE_GOOGLE_CLIENT_ID
      : clientId.value;
    initGoogleTokenClient(router, finalClientId);
  });
};

const handleSignIn = () => {
  if (!isSignInDisabled.value) {
    requestGoogleToken();
  }
};

onMounted(() => {
  loadConfig();
  clientId.value = config.googleClientId;
  isClientIdSaved.value = !!config.googleClientId;
  if (isClientIdAvailable.value || isClientIdSaved.value) {
    initGoogleSignIn();
  }
});
</script>

<style scoped>
.signin-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--background-color);
}

.signin-card {
  background-color: var(--surface-color);
  padding: 3rem;
  border-radius: 12px;
  box-shadow: var(--shadow);
  text-align: center;
  animation: fadeIn 0.5s ease-in-out;
  width: 100%;
  max-width: 400px;
}

.logo {
  height: 80px;
  width: auto;
  margin-bottom: 1.5rem;
}

.signin-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.signin-subtitle {
  font-size: 1.1rem;
  color: var(--text-color-muted);
  margin-bottom: 2.5rem;
}

.input-group {
  display: flex;
  margin-bottom: 1.5rem;
}

input[type='text'] {
  width: 100%;
  padding: 0.8rem;
  font-size: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--surface-color);
  color: var(--text-color);
}

input[type='text']:disabled {
  background-color: var(--background-color);
  color: var(--text-color-muted);
  cursor: not-allowed;
}

.save-button {
  margin-left: 0.5rem;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  background-color: var(--primary-color);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.save-button:hover {
  background-color: var(--primary-color-dark);
}

.google-signin-btn {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1.5rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: #fff;
  color: #333;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  justify-content: center;
}

.google-signin-btn:disabled {
  background-color: #f0f0f0;
  cursor: not-allowed;
  opacity: 0.6;
}

.google-signin-btn:hover:not(:disabled) {
  background-color: #f0f0f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.google-signin-btn img {
  width: 24px;
  height: 24px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
