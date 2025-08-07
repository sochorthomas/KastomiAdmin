<template>
  <div class="not-found">
    <div class="content">
      <h1>404</h1>
      <h2>Stránka nenalezena</h2>
      <p class="text-muted">Omlouváme se, ale požadovaná stránka neexistuje.</p>
      <router-link to="/" class="btn btn-primary">
        <i class="fas fa-home"></i> Zpět na hlavní stránku
      </router-link>
    </div>
  </div>
</template>

<script setup>
// No logic needed for 404 page
</script>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f4f6f9;
}

.content {
  text-align: center;
  padding: 2rem;
}

.content h1 {
  font-size: 6rem;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0;
}

.content h2 {
  font-size: 2rem;
  color: #343a40;
  margin: 1rem 0;
}

.content p {
  font-size: 1.1rem;
  margin-bottom: 2rem;
}
</style>