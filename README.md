# Surat Jalan - Delivery Note Management System

A React-based application for managing delivery notes and purchase orders.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase
This application requires Supabase for the backend database. You need to:

1. **Create a Supabase project:**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Create a new project or use an existing one

2. **Get your credentials:**
   - In your Supabase project dashboard, go to **Settings > API**
   - Copy the **Project URL** and **anon/public key**

3. **Create environment file:**
   - Create a `.env` file in your project root
   - Add the following variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
   VITE_VAPID_PRIVATE_KEY=your_vapid_private_key_here
   ```

   Example:
   ```env
   VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_VAPID_PUBLIC_KEY=BLBz...
   VITE_VAPID_PRIVATE_KEY=your_private_key_here
   ```

### 3. Generate VAPID Keys for Push Notifications
To enable push notifications, you need to generate VAPID keys:

```bash
# Install web-push globally
npm install -g web-push

# Generate VAPID keys
npx web-push generate-vapid-keys

# Copy the generated keys to your .env file
```

### 3. Run the Application
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Features

- Delivery note management
- Purchase order tracking
- Real-time updates
- Responsive design
- Export functionality

## Database Schema

The application uses the following main tables:
- `delivery_notes` - Stores delivery information
- `purchase_orders` - Manages purchase orders
- `destinations` - Stores delivery destinations

## Troubleshooting

### Supabase Connection Issues
If you see "Missing Supabase environment variables" error:
1. Make sure you have created a `.env` file
2. Verify the environment variables are correctly named
3. Restart your development server after creating the `.env` file
4. Check the browser console for detailed setup instructions

### Push Notification Issues
If push notifications are not working:
1. Ensure VAPID keys are properly configured in `.env`
2. Check browser console for service worker errors
3. Verify notification permissions are granted
4. Make sure you're using HTTPS (required for service workers)
5. Check if your browser supports push notifications

### Service Worker Issues
If the app doesn't work offline or service worker fails:
1. Clear browser cache and storage
2. Check if service worker is registered in DevTools > Application
3. Ensure the `sw.js` file is accessible at `/sw.js`
4. Try unregistering and re-registering the service worker
