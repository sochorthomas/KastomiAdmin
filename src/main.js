import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// PrimeVue imports
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'

// PrimeVue components we'll use
import Button from 'primevue/button'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import ToastService from 'primevue/toastservice'
import ProgressSpinner from 'primevue/progressspinner'
import Sidebar from 'primevue/sidebar'
import Drawer from 'primevue/drawer'
import Menu from 'primevue/menu'
import Menubar from 'primevue/menubar'
import Badge from 'primevue/badge'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Panel from 'primevue/panel'
import Avatar from 'primevue/avatar'
import Ripple from 'primevue/ripple'
import Tooltip from 'primevue/tooltip'
import ConfirmationService from 'primevue/confirmationservice'
import ConfirmDialog from 'primevue/confirmdialog'
import Chart from 'primevue/chart'
import FloatLabel from 'primevue/floatlabel'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import DatePicker from 'primevue/datepicker'
import Skeleton from 'primevue/skeleton'
import Divider from 'primevue/divider'
import Breadcrumb from 'primevue/breadcrumb'
import Chip from 'primevue/chip'

// PrimeVue CSS
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'

// Global CSS
import './assets/css/main.css'

const app = createApp(App)

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

// Use PrimeVue services
app.use(ToastService)
app.use(ConfirmationService)

// Register PrimeVue components globally
app.component('Button', Button)
app.component('Card', Card)
app.component('DataTable', DataTable)
app.component('Column', Column)
app.component('InputText', InputText)
app.component('Password', Password)
app.component('Dialog', Dialog)
app.component('Toast', Toast)
app.component('ProgressSpinner', ProgressSpinner)
app.component('Sidebar', Sidebar)
app.component('Drawer', Drawer)
app.component('Menu', Menu)
app.component('Menubar', Menubar)
app.component('Badge', Badge)
app.component('Tag', Tag)
app.component('Dropdown', Dropdown)
app.component('InputNumber', InputNumber)
app.component('Textarea', Textarea)
app.component('Panel', Panel)
app.component('Avatar', Avatar)
app.component('ConfirmDialog', ConfirmDialog)
app.component('Chart', Chart)
app.component('FloatLabel', FloatLabel)
app.component('IconField', IconField)
app.component('InputIcon', InputIcon)
app.component('DatePicker', DatePicker)
app.component('Skeleton', Skeleton)
app.component('Divider', Divider)
app.component('Breadcrumb', Breadcrumb)
app.component('Chip', Chip)

// Register PrimeVue directives
app.directive('ripple', Ripple)
app.directive('tooltip', Tooltip)

app.mount('#app')