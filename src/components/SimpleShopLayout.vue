<template>
  <div class="shop-wrapper">
    <!-- Edit Mode Bar -->
    <div v-if="isAuthenticated" class="edit-mode-bar">
      <label>
        <input type="checkbox" v-model="editMode">
        Edit Mode: {{ editMode ? 'ON' : 'OFF' }}
      </label>
    </div>

    <!-- Header -->
    <header class="shop-header">
      <h1>Kastomi Shop</h1>
      <nav>
        <router-link to="/">Products</router-link>
      </nav>
    </header>

    <!-- Main Content -->
    <main class="shop-main">
      <router-view :edit-mode="editMode" />
    </main>

    <!-- Footer -->
    <footer class="shop-footer">
      <p>&copy; 2024 Kastomi Shop</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, provide } from 'vue'

// Mock authentication for testing
const isAuthenticated = ref(true)
const editMode = ref(false)

// Provide edit mode to child components
provide('editMode', editMode)
</script>

<style scoped>
.shop-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.edit-mode-bar {
  background: #667eea;
  color: white;
  padding: 10px;
  text-align: center;
}

.shop-header {
  background: white;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.shop-header h1 {
  margin: 0;
}

.shop-header nav a {
  color: #333;
  text-decoration: none;
  margin-left: 20px;
}

.shop-main {
  flex: 1;
  padding: 40px;
  background: #f5f5f5;
}

.shop-footer {
  background: #333;
  color: white;
  padding: 20px;
  text-align: center;
}
</style>