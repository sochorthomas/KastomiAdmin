import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ShopApp from './ShopApp.vue'
import router from './router/shop'

// PrimeVue imports
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'

// PrimeVue Components
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'
import Dropdown from 'primevue/dropdown'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

// Styles
import 'primeicons/primeicons.css'
import './assets/css/main.css'

const app = createApp(ShopApp)

// Use Pinia for state management
app.use(createPinia())

// Use Vue Router
app.use(router)

// Use PrimeVue with Aura theme
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',
      darkModeSelector: '.dark',
      cssLayer: false
    }
  },
  ripple: true
})
app.use(ToastService)

// Register global components
app.component('Button', Button)
app.component('Card', Card)
app.component('InputText', InputText)
app.component('Toast', Toast)
app.component('ProgressSpinner', ProgressSpinner)
app.component('Dropdown', Dropdown)
app.component('IconField', IconField)
app.component('InputIcon', InputIcon)

// Register directives
app.directive('tooltip', Tooltip)

// Mount the app
app.mount('#app')