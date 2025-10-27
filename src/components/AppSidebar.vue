<template>
  <aside class="app-sidebar">
    <nav class="main-nav">
      <RouterLink to="/generate" class="nav-link">
        <i class="material-icons">auto_awesome</i>
        <span>Generate</span>
      </RouterLink>
      <RouterLink to="/localize" class="nav-link">
        <i class="material-icons">location_on</i>
        <span>Localize</span>
      </RouterLink>
      <RouterLink to="/validate" class="nav-link">
        <i class="material-icons">task_alt</i>
        <span>Validate</span>
      </RouterLink>
      <RouterLink to="/jobs" class="nav-link">
            <i class="material-icons">cases</i>
        <span>Jobs</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup lang="ts"></script>

<style scoped>
.app-sidebar {
  width: 250px;
  background-color: var(--surface-color);
  border-right: 1px solid var(--border-color);
  padding: 2rem 1rem;
}

.main-nav {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-color-muted);
  font-weight: 500;
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text-color);
}

.nav-link.router-link-exact-active {
  background: linear-gradient(90deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: var(--text-color);
}
</style>
