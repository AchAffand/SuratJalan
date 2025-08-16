// Supabase Edge Function: send-web-push
// Broadcasts a Web Push notification payload to all stored subscriptions

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import webpush from "https://esm.sh/web-push@3.5.2";
import { createClient } from "npm:@supabase/supabase-js@2.50.2";

interface PushPayload {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  renotify?: boolean;
  silent?: boolean;
  data?: Record<string, unknown>;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(req.headers.get('origin') || '*'),
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json', ...corsHeaders(req.headers.get('origin') || '*') },
    });
  }

  try {
    const payload = (await req.json()) as PushPayload;
    if (!payload || !payload.title) {
      return new Response(JSON.stringify({ error: 'Missing payload.title' }), {
        status: 400,
        headers: { 'content-type': 'application/json', ...corsHeaders(req.headers.get('origin') || '*') },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
    const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@example.com';

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Missing Supabase service credentials' }), {
        status: 500,
        headers: { 'content-type': 'application/json', ...corsHeaders(req.headers.get('origin') || '*') },
      });
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(JSON.stringify({ error: 'Missing VAPID keys' }), {
        status: 500,
        headers: { 'content-type': 'application/json', ...corsHeaders(req.headers.get('origin') || '*') },
      });
    }

    // Configure VAPID
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    // Supabase admin client
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Fetch subscriptions
    const { data: subs, error: subsError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth');

    if (subsError) {
      return new Response(JSON.stringify({ error: subsError.message }), {
        status: 500,
        headers: { 'content-type': 'application/json', ...corsHeaders(req.headers.get('origin') || '*') },
      });
    }

    const results: Array<{ id: string; endpoint: string; ok: boolean; status?: number; error?: string }> = [];

    const body = JSON.stringify({
      title: payload.title,
      body: payload.body || '',
      url: payload.url || '/',
      tag: payload.tag,
      icon: payload.icon,
      badge: payload.badge,
      renotify: !!payload.renotify,
      silent: !!payload.silent,
      data: payload.data || {},
    });

    // Send sequentially to avoid throttling; could be batched/concurrent if needed.
    for (const s of subs || []) {
      try {
        const subscription = {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        } as any;
        const response = await webpush.sendNotification(subscription, body);
        results.push({ id: s.id, endpoint: s.endpoint, ok: true, status: (response as any).statusCode || 201 });
      } catch (e) {
        const status = e?.statusCode as number | undefined;
        const reason = e?.body || e?.message || 'Unknown error';
        results.push({ id: s.id, endpoint: s.endpoint, ok: false, status, error: String(reason) });
        // Clean up gone/invalid subscriptions
        if (status === 404 || status === 410) {
          await supabaseAdmin.from('push_subscriptions').delete().eq('id', s.id);
        }
      }
    }

    const sent = results.filter(r => r.ok).length;
    const failed = results.length - sent;

    return new Response(JSON.stringify({ sent, failed, results }), {
      status: 200,
      headers: { 'content-type': 'application/json', ...corsHeaders(req.headers.get('origin') || '*') },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500,
      headers: { 'content-type': 'application/json', ...corsHeaders(req.headers.get('origin') || '*') },
    });
  }
});

function corsHeaders(origin: string) {
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
    'access-control-allow-methods': 'POST, OPTIONS',
  } as Record<string, string>;
}