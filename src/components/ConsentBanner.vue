<template>
  <div v-if="showBanner" class="consent-banner">
    <p class="consent-banner-title">We value your privacy</p>
    <div class="consent-banner-group">
      <p>We use cookies to provide you with the best possible experience. They also allow us to analyze user behavior in
        order to constantly improve the website for you. We do not use cookies for ad personalization.<br>
        By clicking "Accept", you consent to our use of cookies and tracking user activity.
      </p>
      <div class="consent-banner-buttons">
        <button @click="accept" class="consent-button btn-success">Accept</button>
        <button @click="reject" class="consent-button btn-grayscale">Reject</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const showBanner = ref(false);

onMounted(() => {
  if (localStorage.getItem('consentMode') === null) {
    showBanner.value = true;
  }
});

const emit = defineEmits(['consent-given']);

function accept() {
  emit('consent-given', true);
  showBanner.value = false;
}

function reject() {
  emit('consent-given', false);
  showBanner.value = false;
}
</script>

<style scoped>
.consent-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px;
  font-size: 14px;
  z-index: 1000;
  margin-bottom: 40px;
  background-color: #f8f9fa;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  color: black;
}

.body--dark .consent-banner {
  background-color: #393b3c;
  box-shadow: 0 -1px 10px 0 #acabab4d;
  color: white;
}

.consent-banner-title {
  font-weight: 700;
  font-size: 18px;
  line-height: 24px;
  margin: 0 0 12px 0;
  overflow-wrap: break-word;
}

.consent-banner-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  line-height: 24px;
  font-weight: 400;
}

.consent-banner-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 15px;
}

.consent-button {
  border: none;
  padding: 8px 27px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  margin: 0 8px 0 0;
  line-height: 24px;
  cursor: pointer;
  border-radius: 4px;
}

.consent-button:hover {
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.2);
}

.consent-button:active {
  opacity: .5;
}

.consent-button.btn-success {
  background-color: #34a853;
  color: white;
}

.consent-button.btn-grayscale {
  background-color: #dfe1e5;
  color: black;
}
</style>
