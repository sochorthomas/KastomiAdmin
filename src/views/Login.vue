<template>
  <div class="login-page">
    <div class="login-container">
      <Card class="login-card">
        <template #content>
          <div class="text-center mb-5">
            <i class="pi pi-box text-6xl text-primary mb-3"></i>
            <h1 class="text-3xl font-bold text-900 mb-2">Kastomi Admin</h1>
            <p class="text-600">Přihlaste se do administračního rozhraní</p>
          </div>

          <form @submit.prevent="handleLogin">
            <!-- Email Field -->
            <div class="field mb-4">
              <FloatLabel>
                <IconField>
                  <InputIcon class="pi pi-envelope" />
                  <InputText 
                    id="email"
                    v-model="email"
                    type="email"
                    class="w-full"
                    :class="{ 'p-invalid': error && !email }"
                    required
                    autocomplete="email"
                  />
                </IconField>
                <label for="email">Email</label>
              </FloatLabel>
            </div>

            <!-- Password Field -->
            <div class="field mb-5">
              <FloatLabel>
                <IconField>
                  <InputIcon class="pi pi-lock" />
                  <Password 
                    id="password"
                    v-model="password"
                    class="w-full"
                    :class="{ 'p-invalid': error && !password }"
                    :feedback="false"
                    toggleMask
                    required
                    autocomplete="current-password"
                  />
                </IconField>
                <label for="password">Heslo</label>
              </FloatLabel>
            </div>

            <!-- Error Message -->
            <transition name="fade">
              <div v-if="error" class="error-message mb-4">
                <i class="pi pi-exclamation-triangle mr-2"></i>
                {{ error }}
              </div>
            </transition>

            <!-- Submit Button -->
            <Button 
              type="submit"
              label="Přihlásit se"
              icon="pi pi-sign-in"
              class="w-full"
              size="large"
              :loading="loading"
              :disabled="loading || !email || !password"
            />
          </form>

          <div class="divider my-5">
            <span class="divider-text">nebo</span>
          </div>

          <!-- Alternative Login Options -->
          <div class="text-center">
            <Button 
              label="Zapomenuté heslo?"
              link
              @click="forgotPassword"
              class="text-600"
            />
          </div>
        </template>
      </Card>

      <!-- Background decoration -->
      <div class="login-decoration">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
        <div class="circle circle-3"></div>
      </div>
    </div>

    <!-- Toast for notifications -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Form data
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

// Handle login
const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const result = await authStore.signIn(email.value, password.value)
    
    if (result.success) {
      toast.add({ 
        severity: 'success', 
        summary: 'Úspěšné přihlášení', 
        detail: 'Vítejte zpět!', 
        life: 3000 
      })
      
      // Small delay for toast to be visible
      setTimeout(() => {
        router.push('/')
      }, 500)
    } else {
      error.value = result.error || 'Přihlášení se nezdařilo'
      
      // Shake animation on error
      const card = document.querySelector('.login-card')
      card.classList.add('shake')
      setTimeout(() => card.classList.remove('shake'), 500)
    }
  } catch (err) {
    error.value = 'Nastala neočekávaná chyba. Zkuste to prosím znovu.'
  } finally {
    loading.value = false
  }
}

// Forgot password handler
const forgotPassword = () => {
  toast.add({ 
    severity: 'info', 
    summary: 'Obnovení hesla', 
    detail: 'Funkce obnovení hesla není zatím implementována', 
    life: 4000 
  })
}

// Focus email field on mount
onMounted(() => {
  document.getElementById('email')?.focus()
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0084ff 0%, #1e3a8a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  position: relative;
  overflow: hidden;
}

.login-container {
  width: 100%;
  max-width: 450px;
  z-index: 1;
  position: relative;
}

.login-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 1.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 2rem;
}

:deep(.p-card-content) {
  padding: 1.5rem !important;
}

.field {
  position: relative;
}

:deep(.p-inputtext) {
  padding-left: 2.5rem;
  height: 3rem;
  font-size: 1rem;
}

:deep(.p-password input) {
  padding-left: 2.5rem;
  height: 3rem;
  font-size: 1rem;
}

:deep(.p-icon-field > .p-input-icon) {
  top: 50%;
  transform: translateY(-50%);
  left: 0.75rem;
  color: var(--primary-color);
}

:deep(.p-float-label label) {
  left: 2.5rem;
  font-weight: 500;
}

:deep(.p-button-lg) {
  height: 3.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}

:deep(.p-button-lg:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.error-message {
  background-color: #fee;
  color: #c00;
  padding: 0.75rem;
  border-radius: 0.5rem;
  text-align: center;
  font-weight: 500;
  animation: slideDown 0.3s ease;
}

.divider {
  position: relative;
  text-align: center;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e0e0e0;
}

.divider-text {
  position: relative;
  padding: 0 1rem;
  background: white;
  color: #999;
  font-size: 0.875rem;
}

/* Background decoration */
.login-decoration {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 20s infinite ease-in-out;
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: -100px;
  right: -100px;
  animation-delay: 0s;
}

.circle-2 {
  width: 300px;
  height: 300px;
  bottom: -150px;
  left: -150px;
  animation-delay: 5s;
}

.circle-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  right: -75px;
  animation-delay: 10s;
}

/* Animations */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(30px, -30px) rotate(120deg); }
  66% { transform: translate(-20px, 20px) rotate(240deg); }
}

.shake {
  animation: shake 0.5s ease;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem;
  }
  
  :deep(.p-card-content) {
    padding: 1rem !important;
  }
  
  h1 {
    font-size: 1.75rem !important;
  }
}
</style>