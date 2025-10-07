# Environment Setup Guide

## API Base URL Configuration

This project uses environment variables to manage API endpoints for different environments (development, staging, production).

### Setup Instructions

1. **Create Environment File**
   Create a `.env.local` file in the frontend directory:

   ```bash
   # Development
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
   ```

2. **For Production**
   Update the `.env.local` file with your production API URL:

   ```bash
   # Production
   NEXT_PUBLIC_API_BASE_URL=https://your-production-api.com
   ```

3. **For Different Environments**
   You can also create environment-specific files:
   - `.env.development` - for development
   - `.env.staging` - for staging
   - `.env.production` - for production

### Environment Variables

| Variable                   | Description                | Example                                                           |
| -------------------------- | -------------------------- | ----------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for API endpoints | `http://localhost:8080` (dev) or `https://api.yourapp.com` (prod) |

### Usage in Code

The project uses a centralized API configuration in `lib/api.ts`:

```typescript
import { buildApiUrl, API_ENDPOINTS } from "@/lib/api";

// Example usage
const response = await fetch(buildApiUrl(API_ENDPOINTS.PROFILE), {
  headers: { Authorization: `Bearer ${token}` },
});
```

### Benefits

- ✅ **No Hardcoded URLs**: All API calls use environment variables
- ✅ **Easy Deployment**: Change URL in one place for production
- ✅ **Type Safety**: TypeScript support for all endpoints
- ✅ **Centralized**: All API endpoints defined in one file
- ✅ **Maintainable**: Easy to update and manage

### Available Endpoints

The following endpoints are pre-configured:

- **Auth**: Login, Register, Profile
- **User**: Orders, Wishlist, Cart, Address
- **Orders**: Cancel, Return/Replace
- **Upload**: Single, Multiple, Delete

### Deployment Checklist

Before deploying to production:

1. ✅ Update `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
2. ✅ Test all API endpoints work with production URL
3. ✅ Verify CORS settings on your production API
4. ✅ Check SSL certificates for HTTPS endpoints

### Admin Panel Environment Setup

The admin panel components now use environment variables for all API calls:

- **Admin Login**: Uses `adminApi.login()` with environment variable
- **Support Management**: Uses `NEXT_PUBLIC_API_BASE_URL` for socket connections
- **All Admin Components**: Use centralized `adminApi` functions

### Quick Setup

1. Create `.env.local` in the frontend directory:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

2. For production, update the URL:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-production-api.com
```
