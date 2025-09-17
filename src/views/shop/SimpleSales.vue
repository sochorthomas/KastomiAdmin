<template>
  <div class="simple-sales">
    <h1>Shop - Sales Page</h1>
    <p>Edit Mode: {{ editMode ? 'ON' : 'OFF' }}</p>
    
    <div v-if="loading">Loading products...</div>
    
    <div v-else class="products">
      <div v-for="product in products" :key="product.id" class="product-card">
        <h3>{{ product.name }}</h3>
        <p v-if="!editMode">Price: {{ product.price }} Kč</p>
        <div v-else>
          <p>Wholesale: {{ product.wholesale_price }} Kč</p>
          <p>Support: {{ product.price - product.wholesale_price }} Kč</p>
          <p>Final: {{ product.price }} Kč</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted } from 'vue'

const editMode = inject('editMode', ref(false))
const loading = ref(false)
const products = ref([
  { id: 1, name: 'Test Product 1', price: 500, wholesale_price: 400 },
  { id: 2, name: 'Test Product 2', price: 750, wholesale_price: 600 }
])

onMounted(() => {
  console.log('SimpleSales mounted, editMode:', editMode.value)
})
</script>

<style scoped>
.simple-sales {
  padding: 20px;
}

.products {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.product-card {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 8px;
}
</style>