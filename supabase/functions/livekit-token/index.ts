import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SignJWT } from 'https://deno.land/x/jose@v4.14.4/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenRequest {
  roomName?: string;
  participantName?: string;
  metadata?: {
    target_language?: string;
    native_language?: string;
    level?: string;
    speaking_speed?: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const LIVEKIT_API_KEY = Deno.env.get('LIVEKIT_API_KEY');
    const LIVEKIT_API_SECRET = Deno.env.get('LIVEKIT_API_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      throw new Error('LiveKit credentials not configured');
    }

    // Verify the user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: TokenRequest = await req.json().catch(() => ({}));
    const roomName = body.roomName || `room-${user.id}-${Date.now()}`;
    const participantName = body.participantName || user.email || user.id;

    // User preferences metadata (will be attached to participant)
    const userMetadata = JSON.stringify(body.metadata || {});

    // Generate LiveKit JWT token
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 60 * 60 * 6; // 6 hours

    // LiveKit video grant
    const videoGrant = {
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    };

    // Create JWT with LiveKit claims including participant metadata
    const secret = new TextEncoder().encode(LIVEKIT_API_SECRET);
    const token = await new SignJWT({
      video: videoGrant,
      sub: user.id,
      name: participantName,
      iss: LIVEKIT_API_KEY,
      nbf: now,
      exp: exp,
      jti: user.id,
      metadata: userMetadata, // Include user preferences as participant metadata
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .sign(secret);

    return new Response(
      JSON.stringify({
        token,
        roomName,
        participantIdentity: user.id,
        participantName,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error generating token:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
