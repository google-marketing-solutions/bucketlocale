<template>
  <div class="onboarding-container">
    <div v-if="!isAuthenticated" class="nav-header">
      <RouterLink to="/signin" class="back-link">
        <i class="material-icons">arrow_back</i> Back to Sign In
      </RouterLink>
    </div>

    <div class="header-section">
      <h1>Getting Started with BucketLocale</h1>
      <p class="subtitle">Follow these steps to set up your environment and start using the app.</p>
    </div>

    <div class="timeline">
      <!-- Step 1: GCP Project -->
      <div class="timeline-item">
        <div class="timeline-marker">1</div>
        <div class="timeline-content">
          <h2>GCP Project Setup</h2>
          <p>
            Ensure you have a Google Cloud Platform (GCP) project with <strong>billing enabled</strong>.
          </p>
          <div class="links">
            <a href="https://console.cloud.google.com/projectcreate" target="_blank" class="action-link">
              <i class="material-icons">add_circle_outline</i> Create Project
            </a>
          </div>
        </div>
      </div>

      <!-- Step 2: Enable APIs -->
      <div class="timeline-item">
        <div class="timeline-marker">2</div>
        <div class="timeline-content">
          <h2>Enable Required APIs</h2>
          <p>Enable the <strong>Vertex AI API</strong>, the <strong>Google Ads API</strong>, the <strong>Google Sheets API</strong>, and the <strong>Secret Manager API</strong> for your project.</p>
          <div class="links">
            <a href="https://console.cloud.google.com/marketplace/product/google/aiplatform.googleapis.com" target="_blank" class="action-link">
              <i class="material-icons">psychology</i> Vertex AI API
            </a>
            <a href="https://console.cloud.google.com/marketplace/product/google/sheets.googleapis.com" target="_blank" class="action-link">
              <i class="material-icons">table_view</i> Sheets API
            </a>
            <a href="https://console.cloud.google.com/marketplace/product/google/googleads.googleapis.com" target="_blank" class="action-link">
              <i class="material-icons">campaign</i> Ads API
            </a>
            <a href="https://console.cloud.google.com/marketplace/product/google/secretmanager.googleapis.com" target="_blank" class="action-link">
              <i class="material-icons">lock</i> Secret Manager API
            </a>
          </div>
        </div>
      </div>

      <!-- Step 3: OAuth Client ID -->
      <div class="timeline-item">
        <div class="timeline-marker">3</div>
        <div class="timeline-content">
          <h2>Create OAuth Client ID</h2>
          <p>
            Create an OAuth 2.0 Client ID of type <strong>Web application</strong>.
            Set it to <strong>Internal</strong>.
          </p>
          <div class="code-block">
            <p><strong>Authorized JavaScript origins:</strong></p>
            <code>https://bucketlocale-ai.web.app</code>
            <p><strong>Authorized redirect URIs:</strong></p>
            <code>https://bucketlocale-ai.web.app</code>
          </div>
          <p class="note">
            Copy the <strong>Client ID</strong>. You will need to enter this on the Sign In page.
          </p>
          <div class="links">
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" class="action-link">
              <i class="material-icons">vpn_key</i> Create Credentials
            </a>
          </div>
        </div>
      </div>

      <!-- Step 4: Gemini API Key -->
      <div class="timeline-item">
        <div class="timeline-marker">4</div>
        <div class="timeline-content">
          <h2>Generate Gemini API Key</h2>
          <p>
            Get a Gemini API key from Google AI Studio. This is required for the generation features.
          </p>
          <div class="links">
            <a href="https://aistudio.google.com/app/apikey" target="_blank" class="action-link">
              <i class="material-icons">key</i> Get API Key
            </a>
          </div>
        </div>
      </div>

      <!-- Step 5: Configure App -->
      <div class="timeline-item">
        <div class="timeline-marker">5</div>
        <div class="timeline-content">
          <h2>Configure App</h2>
          <ul class="steps-list">
            <li>
              <strong>Sign In Page:</strong> Enter and save your <strong>OAuth Client ID</strong>.
            </li>
            <li>
              <strong>Settings:</strong> After signing in, click the settings icon <i class="material-icons inline-icon">settings</i> in the header.
            </li>
            <li>
              <strong>API Key:</strong> Enter your <strong>Gemini API Key</strong>.
            </li>
            <li class="secret-manager-step">
              <strong>Secret Manager (Optional):</strong> Check the box if you are reading secrets that are saved in GCP Secret Manager instead of locally on your browser.
              <p class="step-detail">
                The keys should be named <code>gemini_api_key</code> and <code>google_ads_developer_token</code>, and saved in the same project as the one associated with the Google Client ID. You need to be granted the role <strong>Secret Manager Secret Accessor</strong> in the IAM.
              </p>
            </li>
            <li>
              <strong>Optional:</strong> Add your <strong>Google Ads MCC ID</strong> and <strong>Developer Token</strong> if you plan to use generation features.
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Cookies from 'js-cookie';

const isAuthenticated = ref(false);

onMounted(() => {
  isAuthenticated.value = !!Cookies.get('google_token');
});
</script>

<style scoped>
.onboarding-container {
  max-width: 900px; /* Increased width slightly */
  margin: 0 auto;
  padding: 2rem;
  color: var(--text-color);
}

.nav-header {
  margin-bottom: 2rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-muted);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: var(--primary-color);
}

.header-section {
  text-align: center;
  margin-bottom: 4rem;
  animation: fadeInDown 0.6s ease-out;
}

.header-section h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 1.2rem;
  color: var(--text-color-muted);
}

.timeline {
  position: relative;
  padding-left: 2rem;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  opacity: 0.3;
}

.timeline-item {
  position: relative;
  margin-bottom: 3rem;
  padding-left: 2rem;
  animation: fadeInRight 0.6s ease-out;
  animation-fill-mode: both;
}

.timeline-item:nth-child(1) { animation-delay: 0.1s; }
.timeline-item:nth-child(2) { animation-delay: 0.2s; }
.timeline-item:nth-child(3) { animation-delay: 0.3s; }
.timeline-item:nth-child(4) { animation-delay: 0.4s; }
.timeline-item:nth-child(5) { animation-delay: 0.5s; }

.timeline-marker {
  position: absolute;
  left: -2.9rem; /* Adjust based on padding-left of timeline-item and width of marker */
  top: 0;
  width: 40px;
  height: 40px;
  background-color: var(--surface-color);
  border: 2px solid var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: var(--primary-color);
  z-index: 1;
  box-shadow: 0 0 10px rgba(0, 198, 255, 0.2);
}

.timeline-content {
  background-color: var(--surface-color);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: var(--shadow);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.timeline-content:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.timeline-content h2 {
  margin-top: 0;
  color: var(--primary-color);
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.timeline-content p {
  line-height: 1.6;
  color: var(--text-color-muted);
  margin-bottom: 1rem;
}

.timeline-content strong {
  color: var(--text-color);
}

.links {
  display: flex;
  gap: 0.8rem; /* Reduced gap */
  flex-wrap: wrap; /* Keep wrap for very small screens, but text shortening should help */
  margin-top: 1rem;
}

.action-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem; /* Reduced padding */
  background-color: rgba(0, 198, 255, 0.1);
  color: var(--primary-color);
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: background-color 0.2s ease;
  white-space: nowrap; /* Prevent text wrapping inside button */
}

.action-link:hover {
  background-color: rgba(0, 198, 255, 0.2);
}

.code-block {
  background-color: rgba(0, 0, 0, 0.3);
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  font-family: monospace;
}

.code-block p {
  margin-bottom: 0.2rem;
  font-size: 0.9rem;
  color: var(--text-color-muted);
}

.code-block code {
  display: block;
  color: #a5d6ff;
  word-break: break-all;
  margin-bottom: 0.8rem;
}

.code-block code:last-child {
  margin-bottom: 0;
}

.note {
  font-size: 0.9rem;
  border-left: 3px solid var(--secondary-color);
  padding-left: 1rem;
  margin-top: 1rem;
  font-style: italic;
}

.steps-list {
  list-style-type: none;
  padding: 0;
}

.steps-list li {
  margin-bottom: 0.8rem;
  padding-left: 1.5rem;
  position: relative;
}

.steps-list li::before {
  content: '•';
  color: var(--primary-color);
  position: absolute;
  left: 0;
  font-weight: bold;
}

.inline-icon {
  font-size: 1.2rem;
  vertical-align: middle;
  color: var(--text-color-muted);
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 768px) {
  .timeline {
    padding-left: 1rem;
  }

  .timeline-marker {
    left: -1.9rem;
    width: 30px;
    height: 30px;
    font-size: 0.9rem;
  }

  .timeline-content {
    padding: 1rem;
  }
}

.step-detail {
  margin-top: 0.4rem;
  font-size: 0.95rem;
  color: var(--text-color-muted);
  line-height: 1.5;
}

.step-detail code {
  background-color: rgba(0, 0, 0, 0.2);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  color: #a5d6ff;
  font-family: monospace;
}
</style>
