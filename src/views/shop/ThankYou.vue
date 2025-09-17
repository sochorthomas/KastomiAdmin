<template>
  <div class="shop-thank-you">
    <div class="container">
      <div class="thank-you-content">
        <i class="pi pi-check-circle"></i>
        <h2>Děkujeme za objednávku!</h2>
        <p>Vaše objednávka byla úspěšně přijata.</p>
        <router-link to="/" class="btn-back">
          Zpět na produkty
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
// Thank you page logic
</script>

<style scoped>
.shop-thank-you {
  min-height: 400px;
  padding: 60px 0;
}

.thank-you-content {
  text-align: center;
  background: white;
  padding: 60px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.thank-you-content i {
  font-size: 64px;
  color: #10b981;
  margin-bottom: 20px;
}

.thank-you-content h2 {
  margin-bottom: 10px;
  color: #333;
}

.thank-you-content p {
  color: #666;
  margin-bottom: 30px;
}

.btn-back {
  display: inline-block;
  padding: 12px 24px;
  background: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background 0.3s ease;
}

.btn-back:hover {
  background: #5a67d8;
}
</style>