<template>
  <header class="app-header">
    <div class="header-content">
      <div class="brand">
        <img src="@/assets/BucketLocale-icon.png" alt="BucketLocale Logo" class="logo" />
        <h1>BucketLocale</h1>
      </div>
      <div class="user-actions">
        <button class="icon-btn settings-btn" @click="$emit('open-settings')">
            <i class="material-icons">settings</i>
        </button>
        <div class="profile-section" @click="toggleDropdown">
          <img :src="userProfile.picture" alt="User Profile" class="profile-picture" />
          <div v-if="isDropdownOpen" class="profile-dropdown">
            <button @click="signOut" class="signout-btn">Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Cookies from 'js-cookie';
import { userProfile } from '../stores/user';


const router = useRouter();
const isDropdownOpen = ref<boolean>(false);

const toggleDropdown = (): void => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const signOut = (): void => {
  // Clear user data
  Cookies.remove('google_token');
  localStorage.removeItem('user_profile');

  // Reset reactive store (optional, but good practice)
  userProfile.value.picture = '';
  userProfile.value.name = '';
  userProfile.value.email = '';

  // Redirect to the sign-in page
  router.push({ name: 'signin' });
};
</script>

<style scoped>
.app-header {
  background-color: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
  padding: 0 2rem;
  height: 70px;
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo {
  height: 40px;
  width: auto;
}

.brand h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.icon-btn {
  background: none;
  border: none;
  color: var(--text-color-muted);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

.icon-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--text-color);
}

.profile-section {
  position: relative;
  cursor: pointer;
}

.profile-picture {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-dropdown {
  position: absolute;
  top: 50px;
  right: 0;
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow);
  padding: 0.5rem;
  z-index: 10;
}

.signout-btn {
  width: 100%;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 6px;
  background-color: transparent;
  color: #ff4d4d;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.signout-btn:hover {
  background-color: rgba(255, 77, 77, 0.1);
}
</style>
