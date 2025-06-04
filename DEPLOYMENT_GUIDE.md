# RMI Passport Application System - Deployment Guide

## System Overview

The RMI Passport Application System is a modern, secure web application built for the Republic of the Marshall Islands passport application process. It provides a comprehensive solution for citizens to apply for passports and for administrators to manage applications.

## Prerequisites

- Node.js 18+ 
- npm or yarn package manager
- Supabase account and project
- Vercel account (for deployment)

## Local Development Setup

### 1. Clone and Install Dependencies

```bash
# Navigate to project directory
cd "applications tab, admin commenting added"

# Install dependencies
npm install
```

### 2. Environment Configuration

1. Copy the environment template:
```bash
copy .env.example .env.local
```

2. Update `.env.local` with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

The system requires several database tables. Use the provided migration files:

1. `supabase-migration.sql` - Main database schema
2. `apply-migration.sql` - Additional features
3. `test-migration.sql` - Test data (optional)

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Production Deployment

### Vercel Deployment (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy using the provided `vercel.json` configuration

### Manual Build

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

## System Features

### For Citizens
- Secure account creation and login
- Comprehensive passport application form
- Document upload with preview
- Application status tracking
- Draft saving and resuming

### For Administrators
- Real-time dashboard with statistics
- Application management and processing
- Admin commenting system
- User management
- Audit trails and activity tracking

## Security Features

- Role-based access control (admin/user)
- Secure file uploads with signed URLs
- Row Level Security (RLS) in database
- Session management with retry logic
- Input validation and sanitization

## Technical Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS
- **Routing**: TanStack Router
- **State Management**: React Context + Hooks

## Support and Maintenance

This system is production-ready and includes:
- Comprehensive error handling
- Performance optimizations
- Mobile-responsive design
- Auto-refreshing admin dashboard
- Secure document management

For technical support or feature requests, refer to the `ENHANCEMENT_RECOMMENDATIONS.md` file for planned improvements.

## License

Built for the Republic of the Marshall Islands Government
© 2025 - All rights reserved
