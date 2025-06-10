# Rate Limiting Implementation for Email Verification

## Overview

We've implemented a robust rate limiting system for the email verification process during signup to prevent abuse and protect system resources. This document details the implementation and configuration.

## Features

1. **Per-Email Rate Limiting**: Limits the number of verification emails that can be sent to a single email address within a specific time window.

2. **Per-IP Rate Limiting**: Limits the number of verification requests from a single IP address to prevent automated attacks.

3. **Time Window Based**: All limits are applied within a configurable time window (currently 60 minutes).

4. **Automatic Cleanup**: Stale rate limit data is automatically purged from the database to maintain system performance.

5. **Graceful Degradation**: If the rate limiting system encounters errors, it defaults to allowing requests rather than blocking legitimate users.

6. **User-Friendly Experience**: Clear feedback to users when rate limits are reached, with a countdown timer showing when they can try again.

## Configuration

The current rate limits are:
- Max 5 verification requests per email address per hour
- Max 10 verification requests per IP address per hour
- 60-minute lockout period after exceeding limits

## Technical Implementation

### Database

- **Table**: `public.rate_limit_requests`
- **Structure**:
  - `id`: UUID primary key
  - `email`: The email address requesting verification
  - `client_ip`: IP address of the requester
  - `created_at`: Timestamp when the request was made

- **Indices**: On email, client_ip, and created_at columns for query performance
- **Row-Level Security**: Only the service role can access this table

### Edge Function

The `send-verification` Edge Function implements rate limiting logic:

1. Records each verification request in the rate limit table
2. Counts requests from the same email/IP in the current time window
3. Blocks requests that exceed configured limits
4. Returns appropriate HTTP status codes and retry information

### Client-Side Implementation

1. **Local Storage**: Stores rate limit information to preserve state across page refreshes
2. **Countdown Timer**: Shows users how long until they can try again
3. **UI Indicators**: Disabled buttons and clear error messages when rate limited
4. **HTTP Status Handling**: Properly handles 429 (Too Many Requests) responses

### Security Considerations

1. **Code Exposure**: Verification codes are not returned in API responses in production environments
2. **Graceful Error Handling**: System doesn't expose internal details when errors occur
3. **RLS Policies**: Database access is properly secured through row-level security

## Future Improvements

1. **Analytics**: Track and analyze rate limit events to identify patterns of abuse
2. **Adaptive Rate Limiting**: Adjust limits automatically based on system load
3. **Geographic Limiting**: Add region-based rate limiting for additional security
4. **Exponential Backoff**: Increase wait times for repeat offenders

## Maintenance

The system includes a scheduled cleanup job that runs daily to remove rate limit records older than 24 hours, preventing database bloat.
