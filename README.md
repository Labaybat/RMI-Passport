# RMI Passport Portal

This is the official passport application frontend for RMI citizens. Built using React, TailwindCSS, Vite, and Supabase.

## Commands

```bash
npm install
npm run dev
```

## Features

- Multi-step email verification during signup
- Rate limiting for security (see RATE_LIMITING_DOCUMENTATION.md)
- Progressive registration flow
- Full application submission and tracking
- Admin approval workflows
- Responsive design optimized for all devices

## Security Features

- Rate limiting on sensitive endpoints
- Email verification before account creation
- One-time verification codes with expiration
- Protection against abuse in registration flow
- Environment-based code exposure prevention

## Setup Instructions

### Database Setup

1. Push migrations to set up database tables:
   ```bash
   npx supabase db push
   ```

2. If migrations fail, manually run the SQL in the `supabase/setup-rate-limiting-sql.sql` file.

### Environment Variables

1. Configure required environment variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. Set Supabase Function Secrets:
   ```bash
   npx supabase secrets set SENDGRID_API_KEY=your_sendgrid_key
   npx supabase secrets set SMTP_FROM_EMAIL=noreply@yourdomain.com
   npx supabase secrets set ENVIRONMENT=production
   ```

## Notes

- Make sure to configure environment variables using `.env.local`
- Push to GitHub and connect to Vercel for deployment
- See `RATE_LIMITING_DOCUMENTATION.md` for details on the rate limiting implementation
