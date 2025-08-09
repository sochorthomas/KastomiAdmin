# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KastomiAdmin is a modern Vue 3 admin panel for managing e-commerce operations. It's a complete rewrite of the original PHP/Nette application, now using Vue 3 with Supabase for authentication and Edge Functions for all data operations. The admin panel manages products, orders, and provides analytics dashboards for sales channels.

## Tech Stack

- **Frontend**: Vue 3 (v3.5.17), Vue Router (v4.5.1), Pinia (state management)
- **Build Tool**: Vite (v6.0.6)
- **UI**: Bootstrap 5.3.7, PrimeVue 4.3.7, Font Awesome 7.0
- **Backend**: Supabase (Auth + Edge Functions)
- **External Integration**: BOB API (e-commerce platform)
- **Database**: External (accessed only via Edge Functions)
- **Architecture**: SPA with component-based structure

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
KastomiAdmin/
├── src/
│   ├── assets/             # CSS styles and logo images
│   │   ├── css/
│   │   │   └── main.css   # Main application styles
│   │   └── *.svg           # Logo assets
│   ├── components/         # Reusable Vue components
│   │   ├── AppLayout.vue   # Main application layout wrapper
│   │   └── ProductDetailDialog.vue  # Product detail/edit modal
│   ├── composables/        # Vue composition functions
│   │   └── useTableControls.js  # Shared table filtering/sorting logic
│   ├── lib/               # Utilities
│   │   └── supabase.js    # Supabase client configuration
│   ├── router/            # Vue Router configuration
│   │   └── index.js       # Routes and navigation guards
│   ├── stores/            # Pinia stores
│   │   └── auth.js        # Authentication and user state
│   ├── utils/             # Utility functions
│   │   ├── orderStatusMapping.js  # BOB order status conversion
│   │   └── variantSorting.js      # Product variant sorting logic
│   ├── views/             # Page components
│   │   ├── Dashboard.vue  # Main dashboard with stats
│   │   ├── Login.vue      # Authentication page
│   │   ├── Products.vue   # Product catalog management
│   │   ├── Orders.vue     # Order management
│   │   ├── Dresy.vue      # Specialty dresy orders
│   │   └── NotFound.vue   # 404 error page
│   ├── App.vue            # Root component
│   └── main.js            # Application entry point
├── supabase/              # Supabase Edge Functions
│   └── functions/         # Individual function directories
├── _old/                  # Legacy PHP/Nette files (reference only)
├── public/                # Static assets
├── index.html             # HTML entry point
├── package.json           # NPM dependencies
└── vite.config.js         # Vite configuration
```

## Key Architecture Patterns

### Authentication Flow
- Uses Supabase Auth with email/password authentication
- Session persistence with localStorage
- Auth state managed in Pinia store (`stores/auth.js`)
- Route guards protect authenticated routes
- Auto-redirect to login for unauthenticated users
- Sales channel data loaded automatically after authentication

### Data Access Pattern
**CRITICAL**: All data operations MUST go through Supabase Edge Functions
- NO direct database access from frontend
- Use `supabase.functions.invoke('function-name', { body: params })`
- External database remains unchanged
- Edge Functions handle all business logic and data transformations
- BOB API integration for e-commerce platform data

### State Management
- **Pinia Auth Store** (`stores/auth.js`):
  - User authentication state
  - Sales channel information
  - Club data and configuration
  - Methods: `signIn()`, `signOut()`, `fetchSalesChannel()`
  - Getters: `isAuthenticated`, `userEmail`, `salesChannelUrl`, `clubName`

### Layout Structure
- `AppLayout.vue` provides consistent layout with:
  - Responsive sidebar navigation (collapsible)
  - User profile and logout
  - Club logo and information display
  - Date filtering for dashboard (stored as null by default, shows all records)
  - Mobile-friendly drawer navigation
  - Dynamic favicon based on sales channel
- Views are wrapped in AppLayout via router meta `layout: 'app'`
- Bootstrap grid system for responsive layouts

## Views Documentation

### Dashboard.vue (`/prehled`)
- Statistics cards: order count, total revenue, product count
- Quick action cards for navigation
- Recent orders table with status indicators
- Date filtering (from/to) - defaults to no "from" date to show all records
- Integration with `dashboard-stats` edge function
- Real-time data refresh capabilities

### Products.vue (`/produkty`)
- Product catalog grid with thumbnails
- Complex status system (see Product Status Logic below)
- Search and filtering capabilities
- Inline price editing via ProductDetailDialog
- Variant hover cards showing detailed information
- External links to live e-shop products
- Pagination with customizable rows per page

### Orders.vue (`/objednavky`)
- Order statistics summary cards
- Advanced filtering: date range, status, search
- Status mapping from complex BOB statuses to simplified view
- Customer contact information display
- Date filtering defaults to no "from" date to show all records
- Expandable rows for order items
- Integration with `get-orders` edge function

### Dresy.vue (`/dresy`)
- Conditional display based on dresy count > 0
- Specialized view for jersey orders
- Integration with `get-dresy-count` edge function

### Login.vue (`/prihlaseni`)
- Modern gradient design with animated background
- Email/password authentication
- Floating labels and input validation
- Error handling with visual feedback
- Toast notifications for user feedback

## Product Status Logic

### Dual Status System
Products have two independent status levels:

1. **Kastomi Status** (`sales_offer_status_id`):
   - Controlled by Kastomi system (read-only for channels)
   - Values:
     - 1 = Active (can be sold)
     - 2 = Active but can't buy (visible but not purchasable)
     - 3 = Inactive (disabled)
     - 4 = Hidden (completely hidden)

2. **Channel Status** (`active_channel`):
   - Controlled by individual sales channels
   - Values:
     - 1 = Active on channel
     - 0 = Inactive on channel

### Status Determination
A product is shown as "Active" in the admin only when:
- Kastomi status = 1 (Active) AND
- Channel status = 1 (Active)

Channel admins can only toggle channel status when Kastomi status is 1 or 2.
When Kastomi status is 3 or 4, the channel toggle is disabled with an info tooltip.

## Components Documentation

### AppLayout.vue
Main application wrapper providing:
- Responsive sidebar with collapse functionality
- Dynamic club logo and favicon loading
- User profile section with email and logout
- Sales channel URL display and external link
- Date picker controls for dashboard filtering
- Mobile drawer for smaller screens
- Breadcrumb navigation
- Dynamic menu based on dresy availability

### ProductDetailDialog.vue
Modal dialog for product details and editing:
- Dual status display (Kastomi + Channel)
- Read-only Kastomi status with visual badge
- Editable channel status with toggle switch
- Inline editing for prices and descriptions
- Visual feedback when channel toggle is disabled
- Image viewer with fullscreen capability
- Variant information display
- Real-time save with loading states

## Environment Configuration

Required environment variables in `.env`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Edge Functions

All data operations go through Edge Functions in `supabase/functions/`:

### Core Functions
- **bob-api**: Generic BOB API communication gateway
- **dashboard-stats**: Dashboard analytics with date filtering
- **get-sales-offers**: Product catalog from BOB
- **get-orders**: Orders list with filtering
- **get-order-detail**: Detailed order information
- **update-sales-offer**: Update product prices and status
- **get-dresy-count**: Count for menu conditional display

### BOB Integration Functions
- **bob-report**: Generate BOB reports
- **bob-order-items**: Fetch order items
- **bob-order-items-structured**: Structured order data
- **get-sales-channel**: Sales channel configuration
- **get-customer-contacts**: Customer contact information

### Edge Function Pattern
```javascript
// Frontend call example
const { data, error } = await supabase.functions.invoke('function-name', {
  body: {
    param1: value1,
    param2: value2
  }
})

// Error handling
if (error) {
  console.error('Error:', error)
  // Show user feedback
}
```

## Routing System

### Routes
- `/` - Redirects to dashboard or login
- `/prihlaseni` - Login page
- `/prehled` - Dashboard (requires auth)
- `/produkty` - Products management (requires auth)
- `/objednavky` - Orders management (requires auth)
- `/dresy` - Dresy orders (requires auth, conditional display)

### Route Guards
```javascript
// Routes use meta properties for protection
{
  path: '/protected',
  meta: { 
    requiresAuth: true,    // Requires authentication
    layout: 'app'          // Uses AppLayout wrapper
  }
}
```

### Navigation Flow
1. Unauthenticated users redirected to `/prihlaseni`
2. After login, redirect to `/prehled` (dashboard)
3. Sales channel data loaded with 5-second timeout
4. Navigation menu updates based on user permissions

## UI/UX Guidelines

### Design System
- Bootstrap 5 for base components and grid
- PrimeVue for advanced components (DataTable, Dialog, etc.)
- Custom CSS variables for consistent theming
- Font Awesome 7 icons throughout
- Czech language interface

### Component Patterns
- **Cards**: White background with shadow for content sections
- **Tables**: Striped rows, hover effects, sortable columns
- **Forms**: Floating labels, inline editing where possible
- **Status Badges**: Color-coded with gradients
- **Loading States**: Skeleton loaders and progress spinners
- **Empty States**: Informative messages with action buttons

### Responsive Design
- Mobile-first approach
- Collapsible sidebar for desktop
- Drawer navigation for mobile
- Touch-friendly interface elements
- Horizontal scroll for wide tables

### Color Scheme
- **Primary**: Blue gradients (#0084ff to #1e3a8a)
- **Success**: Green gradients (#10b981 to #34d399)
- **Warning**: Yellow gradients (#f59e0b to #fbbf24)
- **Danger**: Red gradients (#ef4444 to #f87171)
- **Neutral**: Gray scale (#6b7280 to #9ca3af)

## Utility Functions

### useTableControls.js
Composable for table management:
- Global search across multiple fields
- Column-specific filtering
- Sort state management
- LocalStorage persistence
- Filter options extraction

### orderStatusMapping.js
BOB order status utilities:
- Complex to simple status mapping
- Status severity determination
- Icon associations
- Filter functions
- Czech translations

### variantSorting.js
Product variant organization:
- Size-based sorting (XS, S, M, L, XL, XXL, etc.)
- Alphanumeric sorting for other variants
- Consistent ordering across the app

## Common Development Tasks

### Adding a New View
1. Create component in `src/views/`
2. Add route in `src/router/index.js` with `requiresAuth: true`
3. Add navigation item in `AppLayout.vue` menuItems
4. Create corresponding Edge Function if needed

### Adding an Edge Function
1. Create new directory in `supabase/functions/function-name/`
2. Add `index.ts` with Deno serve handler
3. Handle CORS, authentication, and error handling
4. Call using `supabase.functions.invoke('function-name')`

### Updating Product Status
1. Check both Kastomi and channel status
2. Use `isProductActive()` helper for display
3. Disable channel toggle when Kastomi status > 2
4. Show appropriate visual feedback

### Working with BOB API
1. All BOB calls go through `bob-api` edge function
2. Use module system with proper authentication
3. Handle response transformation in edge function
4. Cache data where appropriate

## Security Considerations

- All authentication through Supabase Auth
- No sensitive data in frontend code
- Environment variables for configuration
- CORS handled by Edge Functions
- Input validation on both frontend and Edge Functions
- Sales channel isolation (multi-tenancy)
- JWT token validation in Edge Functions

## Performance Optimizations

- Lazy loading for views with Vue Router
- Image optimization with CDN URLs
- Pagination for large datasets
- Debounced search inputs
- Skeleton loaders during data fetching
- LocalStorage for filter persistence

## Dependencies

### Production
- **@supabase/supabase-js** (^2.53.0): Backend integration
- **vue** (^3.5.17): Core framework
- **vue-router** (^4.5.1): Routing
- **pinia** (^3.0.3): State management
- **bootstrap** (^5.3.7): CSS framework
- **primevue** (^4.3.7): UI components
- **chart.js** (^4.5.0): Analytics charts

### Development
- **vite** (^6.0.6): Build tool
- **@vitejs/plugin-vue** (^6.0.0): Vue support

## Deployment Notes

- Build with `npm run build`
- Output in `dist/` directory
- Configure web server for SPA (redirect all routes to index.html)
- Set environment variables on server
- Enable CORS for Supabase Edge Functions
- Consider CDN for static assets

## Troubleshooting

### Common Issues
1. **Authentication fails**: Check Supabase URL and anon key
2. **Edge Functions timeout**: Verify CORS and authentication headers
3. **Missing products**: Check sales channel URL configuration
4. **Status display incorrect**: Verify both Kastomi and channel status values
5. **Date filters not working**: Ensure dates are properly formatted

### Debug Mode
- Check browser console for detailed error messages
- Use Vue DevTools for state inspection
- Monitor Network tab for API calls
- Check Supabase logs for Edge Function errors