# DataVue - Visual Data Historian Setup Guide

## Prerequisites

1. **Node.js 18+** installed
2. **PostgreSQL** database running
3. **Git** for version control

## Database Setup

1. **Create the database** (if not already created):
```sql
CREATE DATABASE visual_historian;
```

2. **Verify connection** with your credentials:
   - Host: localhost (or your PostgreSQL host)
   - Database: `visual_historian`
   - Username: `postgres`
   - Password: `ala1nna`

## Installation Steps

1. **Install dependencies**:
```bash
npm install
```

2. **Create environment file**:
Create a `.env.local` file in your project root:
```env
DATABASE_URL=postgresql://postgres:ala1nna@localhost:5432/visual_historian
NEXTAUTH_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

3. **Generate and push database schema**:
```bash
# Generate migration files
npm run db:generate

# Push schema to database
npm run db:push
```

4. **Seed the database** with sample data:
```bash
npm run db:seed
```

5. **Start the development server**:
```bash
npm run dev
```

## File Structure

Create these files in your project:

### Core Files
- `src/lib/db/index.ts` - Database connection
- `src/lib/db/schema.ts` - Database schema
- `src/lib/db/seed.ts` - Seed data
- `src/lib/api-client.ts` - API client
- `src/lib/data-sources/types.ts` - TypeScript types
- `src/lib/data-sources/manager.ts` - Data source runtime manager
- `src/middleware/auth.ts` - Authentication middleware
- `src/hooks/use-auth.tsx` - Authentication hook
- `src/hooks/use-toast.ts` - Toast notification hook

### Updated Pages
- `src/app/(dashboard)/data-sources/page.tsx` - Data sources management
- `src/app/(dashboard)/layout.tsx` - Dashboard layout with auth
- `src/components/sidebar-nav.tsx` - Navigation sidebar

### Configuration
- `drizzle.config.ts` - Drizzle ORM configuration
- `package.json` - Dependencies
- `.env.local` - Environment variables

## Default Login Credentials

After seeding, you can login with:

### Admin User
- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Permissions**: Full access to all features

### Engineer User
- **Email**: `engineer@example.com`  
- **Password**: `engineer123`
- **Permissions**: Create and manage data sources

## Features

### ✅ Working Features
1. **User Authentication** - Login/logout with session management
2. **Data Source Management** - Full CRUD operations
3. **Protocol Support** - MODBUS, MQTT, NMEA, OPC, API, File sources
4. **Runtime Control** - Start/stop data sources
5. **Dynamic Configuration** - Protocol-specific configuration forms
6. **User Management** - Admin can manage users and permissions
7. **Storage Configuration** - AI-powered database recommendations
8. **Protocol Translation** - AI-powered protocol parsing

### 🎯 Key Components
- **Dashboard** - Real-time data visualization
- **Data Sources** - Configure and manage data ingestion points
- **Storage** - Database configuration and optimization
- **Protocol Translator** - Parse and translate unknown protocols
- **Settings** - User management and system configuration

## Database Schema

The application creates these tables:
- `users` - User accounts and roles
- `sessions` - Authentication sessions
- `data_sources` - Data source configurations
- `data_points` - Time-series data storage
- `storage_configs` - Storage configurations
- `audit_logs` - System audit trail
- `system_metrics` - Performance monitoring

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Data Sources
- `GET /api/data-sources` - List all sources
- `POST /api/data-sources` - Create new source
- `GET /api/data-sources/[id]` - Get specific source
- `PUT /api/data-sources/[id]` - Update source
- `DELETE /api/data-sources/[id]` - Delete source
- `POST /api/data-sources/[id]/start` - Start source
- `POST /api/data-sources/[id]/stop` - Stop source

## Troubleshooting

### Database Connection Issues
1. Verify PostgreSQL is running
2. Check credentials in `.env.local`
3. Ensure database `visual_historian` exists
4. Test connection: `npm run db:studio`

### Build Issues
1. Clear Next.js cache: `rm -rf .next`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Regenerate database: `npm run db:generate && npm run db