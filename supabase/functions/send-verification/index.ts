// @deno-types="https://deno.land/x/servest@v1.3.1/types/react/index.d.ts"
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.24.0'

// Declare the Deno namespace for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Define CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_REQUESTS_PER_EMAIL: 5,   // Max 5 requests per email
  MAX_REQUESTS_PER_IP: 10,     // Max 10 requests per IP address
  WINDOW_DURATION_MINUTES: 60, // In a 60-minute window
  RETRY_AFTER_MINUTES: 60      // Retry after 60 minutes
}

// Rate limiting function to check if the request should be allowed
async function checkRateLimit(supabase: any, email: string, clientIp: string): Promise<{ allowed: boolean; retryAfter?: number; reason?: string }> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - (RATE_LIMIT.WINDOW_DURATION_MINUTES * 60 * 1000))
  
  try {
    // Create rate_limit_requests table if it doesn't exist
    try {
      await supabase.rpc('create_rate_limit_table_simplified')
    } catch (error) {
      console.error('Error creating rate limit table:', error)
      // If we can't create the table, default to allowing the request
      return { allowed: true }
    }
    
    // Insert current request into rate limit tracking table
    const { error: insertError } = await supabase
      .from('rate_limit_requests')
      .insert([{
        email: email,
        client_ip: clientIp,
        created_at: now.toISOString()
      }])
      
    if (insertError) {
      console.error('Error inserting rate limit record:', insertError)
      // If we can't track rate limits, default to allowing the request
      return { allowed: true }
    }
    
    // Count requests by email in time window
    const { data: emailRequests, error: emailError } = await supabase
      .from('rate_limit_requests')
      .select('id')
      .eq('email', email)
      .gte('created_at', windowStart.toISOString())
      
    if (emailError) {
      console.error('Error checking email rate limit:', emailError)
      // If we can't check rate limits, default to allowing the request
      return { allowed: true }
    }
    
    // Count requests by IP in time window
    const { data: ipRequests, error: ipError } = await supabase
      .from('rate_limit_requests')
      .select('id')
      .eq('client_ip', clientIp)
      .gte('created_at', windowStart.toISOString())
      
    if (ipError) {
      console.error('Error checking IP rate limit:', ipError)
      // If we can't check rate limits, default to allowing the request
      return { allowed: true }
    }
    
    // Check if email limit exceeded
    if (emailRequests && emailRequests.length > RATE_LIMIT.MAX_REQUESTS_PER_EMAIL) {
      return { 
        allowed: false, 
        retryAfter: RATE_LIMIT.RETRY_AFTER_MINUTES * 60, 
        reason: 'Too many verification requests for this email'
      }
    }
    
    // Check if IP limit exceeded
    if (ipRequests && ipRequests.length > RATE_LIMIT.MAX_REQUESTS_PER_IP) {
      return { 
        allowed: false, 
        retryAfter: RATE_LIMIT.RETRY_AFTER_MINUTES * 60,
        reason: 'Too many verification requests from this network'
      }
    }
    
    // All checks passed, allow the request
    return { allowed: true }
  } catch (error) {
    console.error('Unexpected error in rate limiting:', error)
    // If we encounter an unexpected error, default to allowing the request
    return { allowed: true }
  }
}

serve(async (req) => {
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // Parse the request body
    const { email } = await req.json()
    
    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown'
    
    // Validate input
    if (!email) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email is required' 
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }, 
          status: 400 
        }
      )
    }

    console.log(`Processing verification request for email: ${email} from IP: ${clientIp}`)

    // Create a Supabase client with the service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check rate limits
    const rateLimitResult = await checkRateLimit(supabase, email, clientIp)
    
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: rateLimitResult.reason || 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.retryAfter?.toString() || '3600',
            ...corsHeaders
          }, 
          status: 429 // Too Many Requests
        }
      )
    }

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Set expiration time (30 minutes from now)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30)

    // Store code in recovery_codes table
    const { error: dbError } = await supabase
      .from('recovery_codes')
      .insert([
        {
          email: email,
          code: code,
          expires_at: expiresAt.toISOString(),
          used: false
        }
      ])

    if (dbError) {
      console.error('Error storing verification code:', dbError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to store verification code' 
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }, 
          status: 500 
        }      )
    }
    
    // Send email with verification code using SendGrid
    try {
      const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
      const SMTP_FROM_EMAIL = Deno.env.get('SMTP_FROM_EMAIL') || 'noreply@thehandicraftshop.com'
      
      if (!SENDGRID_API_KEY) {
        console.warn('SendGrid API key not found. Email will not be sent.')
        // Continue without sending email, but log warning
      } else {
        // Send email with SendGrid
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: email }]
            }],
            from: { email: SMTP_FROM_EMAIL },
            subject: 'Your RMI Passport Portal Verification Code',
            content: [{
              type: 'text/html',
              value: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h2 style="color: #1e3a8a; margin-bottom: 5px;">RMI Passport Portal</h2>
                  <p style="color: #4b5563; margin-top: 0;">Republic of the Marshall Islands</p>
                </div>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                  <p style="margin-bottom: 10px;">Your verification code is:</p>
                  <h1 style="font-size: 32px; letter-spacing: 6px; text-align: center; background-color: #ffffff; padding: 10px; border-radius: 4px; margin: 10px 0; font-weight: bold; color: #1e3a8a;">${code}</h1>
                  <p style="color: #4b5563; font-size: 14px;">This code will expire in 30 minutes.</p>
                </div>
                <p style="color: #4b5563; font-size: 14px; margin-top: 20px;">If you did not request this code, please ignore this email or contact support if you believe this is an error.</p>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #9ca3af; font-size: 12px;">
                  <p>© 2025 Republic of the Marshall Islands. All rights reserved.</p>
                </div>
              </div>
              `
            }]
          })
        })
        
        if (response.status >= 200 && response.status < 300) {
          console.log(`Email sent successfully to ${email}`)
        } else {
          const errorData = await response.text()
          console.error(`Failed to send email: ${response.status} ${response.statusText}`, errorData)
          // Continue execution even if email fails
        }
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // Continue execution even if email fails
    }

    // Return success response
    const responseData: any = {
      success: true,
      message: 'Verification code sent successfully'
    }
    
    // Only include the code in development environments
    if (Deno.env.get('ENVIRONMENT') === 'development') {
      responseData.code = code
    }

    return new Response(
      JSON.stringify(responseData),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        status: 200
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        status: 500
      }
    )
  }
})
