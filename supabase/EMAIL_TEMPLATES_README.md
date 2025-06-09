# Supabase Email Templates Setup Guide

This guide explains how to set up custom email templates for the RMI Passport Portal with proper branding and legal compliance.

## Overview

The RMI Passport Portal uses custom email templates that include:
- RMI government branding and seal
- Legal notices from the Passport Act, 2020 (43 MIRC Ch.11)
- Professional styling with responsive design
- Security notifications and instructions

## Email Templates

### 1. Password Recovery (`recovery.html`)
- **Subject**: "Reset Your RMI Passport Portal Password"
- **Purpose**: Sent when users request password reset
- **Features**: Secure reset link, security warnings, legal compliance

### 2. Email Confirmation (`confirmation.html`)
- **Subject**: "Welcome to RMI Passport Portal"
- **Purpose**: Sent to new users to confirm email address
- **Features**: Welcome message, next steps, legal requirements

### 3. Magic Link (`magic_link.html`)
- **Subject**: "Your RMI Passport Portal Login Link"
- **Purpose**: Passwordless login via email link
- **Features**: Secure one-time login, security information

### 4. Email Change (`email_change.html`)
- **Subject**: "Confirm Your New Email Address - RMI Passport Portal"
- **Purpose**: Confirm email address changes
- **Features**: Change confirmation, security warnings

## Local Development Setup

### 1. Start Supabase Local Development
```cmd
npx supabase start
```

### 2. Apply Email Templates
The templates are automatically loaded from the `supabase/templates/` directory when you start the local Supabase instance.

### 3. Test Email Templates
```cmd
npx supabase functions serve
```

Access the local Supabase Studio at `http://localhost:54323` to test authentication flows.

## Production Deployment

### Option 1: Supabase Dashboard (Recommended)

1. **Access Email Templates**:
   - Go to your Supabase project dashboard
   - Navigate to **Authentication** > **Email Templates**

2. **Update Each Template**:
   - **Password Recovery**: Copy content from `supabase/templates/recovery.html`
   - **Email Confirmation**: Copy content from `supabase/templates/confirmation.html`
   - **Magic Link**: Copy content from `supabase/templates/magic_link.html`
   - **Email Change**: Copy content from `supabase/templates/email_change.html`

3. **Configure Redirect URLs**:
   - Go to **Authentication** > **URL Configuration**
   - Add your production domain URLs:
     ```
     https://your-domain.com
     https://your-domain.com/reset-password
     https://your-domain.com/login
     ```

### Option 2: Supabase CLI Deployment

1. **Link to Production Project**:
```cmd
npx supabase link --project-ref YOUR_PROJECT_REF
```

2. **Deploy Configuration**:
```cmd
npx supabase db push
```

Note: Email templates may need to be manually configured in the dashboard even with CLI deployment.

## Template Customization

### Updating Site URLs
Replace placeholder URLs in the templates:
- Update `{{ .SiteURL }}` references
- Replace `https://your-production-domain.com` with your actual domain
- Ensure all redirect URLs match your application's routing

### Styling Modifications
The templates use inline CSS for maximum email client compatibility:
- **Colors**: Blue gradient theme matching RMI branding
- **Fonts**: System fonts for reliability
- **Layout**: Responsive design with mobile support
- **Components**: Header, content sections, footer with legal notices

### Legal Compliance
Each template includes:
- **Passport Act, 2020 (43 MIRC Ch.11)** references
- **Government Authority** statements
- **Security Notices** and disclaimers
- **Official Branding** with RMI identification

## Testing Email Templates

### Local Testing
1. Start your application: `npm run dev`
2. Go to login page and click "Forgot password?"
3. Enter an email address
4. Check local email logs or use a service like MailHog

### Production Testing
1. Deploy templates to production
2. Test password recovery flow
3. Verify email content and branding
4. Confirm all links work correctly

## Troubleshooting

### Templates Not Loading
- Ensure templates are in `supabase/templates/` directory
- Check file permissions and naming
- Restart Supabase local instance

### Styling Issues
- Email clients have limited CSS support
- Test with multiple email providers (Gmail, Outlook, etc.)
- Verify inline styles are preserved

### URL Redirect Issues
- Confirm redirect URLs in Supabase dashboard
- Check that URLs match your application routing
- Ensure HTTPS is used in production

## Maintenance

### Regular Updates
- Review legal notices annually
- Update contact information as needed
- Test email delivery periodically
- Monitor email client compatibility

### Security Considerations
- Regularly review email template security
- Ensure no sensitive information is exposed
- Maintain secure redirect URL configuration
- Monitor for phishing attempts using similar templates

## Support

For issues with email templates:
1. Check Supabase dashboard authentication logs
2. Verify template syntax and Supabase variables
3. Test with different email providers
4. Contact Supabase support for platform-specific issues

---

**Note**: These templates are designed specifically for the Republic of the Marshall Islands Passport Portal and include legal compliance with the Passport Act, 2020. Ensure all legal references remain accurate and up-to-date.
