# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KastomiAdmin is a modern Vue 3 admin panel for managing e-commerce operations. It's a complete rewrite of the original PHP/Nette application, now using Vue 3 with Supabase for authentication and Edge Functions for all data operations. The admin panel manages products, orders, and provides analytics dashboards.

## Tech Stack

- **Frontend**: Vue 3, Vue Router, Pinia (state management)
- **Build Tool**: Vite
- **UI**: Bootstrap 5, Font Awesome icons
- **Backend**: Supabase (Auth + Edge Functions)
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
│   ├── assets/         # CSS and static assets
│   ├── components/     # Reusable Vue components
│   │   └── AppLayout.vue
│   ├── lib/           # Utilities (Supabase client)
│   ├── router/        # Vue Router configuration
│   ├── stores/        # Pinia stores
│   │   └── auth.js
│   ├── views/         # Page components
│   │   ├── Login.vue
│   │   ├── Dashboard.vue
│   │   ├── Products.vue
│   │   ├── Orders.vue
│   │   └── NotFound.vue
│   ├── App.vue        # Root component
│   └── main.js        # Application entry point
├── _old/              # Original PHP/Nette files for reference
├── .env               # Environment variables
├── index.html         # HTML entry point
├── package.json       # NPM dependencies
└── vite.config.js     # Vite configuration
```

## Key Architecture Patterns

### Authentication
- Uses Supabase Auth for user authentication
- Session persistence enabled
- Auth state managed in Pinia store (`stores/auth.js`)
- Route guards protect authenticated routes
- Auto-redirect to login for unauthenticated users

### Data Access Pattern
**CRITICAL**: All data operations MUST go through Supabase Edge Functions
- NO direct database access from frontend
- Use `supabase.functions.invoke('function-name', { body: params })`
- External database remains unchanged
- Edge Functions handle all business logic and data transformations

### State Management
- Pinia for global state (authentication, user data)
- Component-level state for UI interactions
- Reactive data flow with Vue 3 Composition API

### Layout Structure
- `AppLayout.vue` provides consistent layout with sidebar navigation
- Responsive design with mobile menu toggle
- Views are wrapped in AppLayout component
- Bootstrap grid system for responsive layouts

## Environment Configuration

Required environment variables in `.env`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Edge Functions Architecture

All data operations will be implemented as Supabase Edge Functions:

### Planned Edge Functions
1. **auth-check** - Verify user authentication and permissions
2. **dashboard-stats** - Get dashboard analytics data
3. **products-list** - Fetch products with filtering
4. **product-update** - Update product information
5. **orders-list** - Fetch orders with filtering
6. **order-process** - Process order status changes
7. **sales-channels** - Get sales channels list

### Edge Function Pattern
```javascript
// Frontend call example
const { data, error } = await supabase.functions.invoke('products-list', {
  body: {
    page: 1,
    limit: 20,
    status: 'active',
    channel_id: 1
  }
})
```

## UI/UX Guidelines

### Design System
- Bootstrap 5 for base components
- Custom CSS variables for theming
- Font Awesome icons throughout
- Czech language interface

### Component Structure
- Views handle page-level logic
- Components are reusable UI pieces
- Consistent card-based layouts
- Loading states for all async operations

### Responsive Design
- Mobile-first approach
- Collapsible sidebar for mobile
- Responsive tables with horizontal scroll
- Touch-friendly interface elements

## Migration Notes from PHP Version

### Feature Mapping
- **Login** → Supabase Auth
- **Dashboard stats** → Edge Function with date filtering
- **Product management** → Vue component with Edge Function data
- **Order management** → Vue component with Edge Function data
- **Caching** → Consider implementing frontend caching strategy

### Data Structure
- Maintain same data structure as PHP version
- Edge Functions transform data as needed
- Frontend displays data without modification

## Common Development Tasks

### Adding a New View
1. Create component in `src/views/`
2. Add route in `src/router/index.js`
3. Add navigation link in `AppLayout.vue`
4. Implement corresponding Edge Function if needed

### Adding an Edge Function Call
1. Create the Edge Function in Supabase
2. Call using `supabase.functions.invoke()`
3. Handle loading states
4. Display errors to user

### Styling Components
1. Use Bootstrap classes first
2. Add scoped styles in component
3. Use CSS variables for consistency
4. Maintain responsive design

## Security Considerations

- All authentication through Supabase
- No sensitive data in frontend code
- Environment variables for configuration
- CORS handled by Edge Functions
- Input validation on both frontend and Edge Functions

## BOB API Integration

### Available API Methods

#### setSalesOffer
Updates a sales offer (product) in the BOB system.

**Endpoint:** `https://bob.kastomi.com/api/kastomi/setSalesOffer`

**Method:** POST

**Headers:**
- `Authorization: Bearer {JWT_TOKEN}`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "id": 123,              // Sales offer ID (required)
  "price": 250,           // Final price (wholesale + club support)
  "text": "Description",  // Product description (optional)
  "active": 1             // Active status: 1 = active, 0 = inactive
}
```

**Notes:**
- The price is the final selling price calculated as: `wholesale_price + klub_price`
- The JWT must be signed with the BOB_PRIVATE_KEY
- This method updates the product at the sales offer level (not individual variants)
- Edge function: `update-sales-offer`

## BOB API Modules

The BOB API uses a modular system where each request specifies a module and method. All modules use the "kastomi" namespace and require a URL parameter (typically the sales channel URL).

### Available BOB API Modules

| Module | Method | Parameters | Description |
|--------|---------|------------|-------------|
| kastomi | salesChannelDashboard | url, from, to | Dashboard statistics for date range |
| kastomi | orderNumber | url | Get next order number |
| kastomi | salesWebPages | url | Get web pages for sales channel |
| kastomi | salesUsers | url | Get users for sales channel |
| kastomi | salesChannel | url | Get sales channel details |
| kastomi | salesChannelDelivery | url | Get delivery options |
| kastomi | salesOrders | url | Get orders list |
| kastomi | salesOffer | url | Get product offers/catalog |
| kastomi | salesChannelSetting | url | Get sales channel settings |
| kastomi | salesCategory | url | Get product categories |
| kastomi | soubory | url | Get files/assets |

### BOB API Call Pattern

```javascript
const module = {
  module: "kastomi",
  method: "methodName",
  key: `get_methodName_${Date.now()}`,
  data: {
    url: salesChannelUrl,
    // additional parameters as needed
  }
}
```

### Example Edge Function for BOB Modules

```javascript
// Call bob-api edge function
const { data: bobResponse, error: bobError } = await supabaseClient.functions.invoke('bob-api', {
  body: { modules: [module] },
  headers: { Authorization: authHeader }
})

// Extract data from response
const data = bobResponse.modules?.[0]?.data || []
```