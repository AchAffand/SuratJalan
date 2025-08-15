import { supabase } from '../lib/supabase';

export type PushMessage = {
	title: string;
	body?: string;
	url?: string;
	tag?: string;
	icon?: string;
	badge?: string;
	renotify?: boolean;
	silent?: boolean;
	data?: Record<string, unknown>;
};

export const broadcastPush = async (message: PushMessage) => {
	try {
		const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-web-push`;
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
			},
			body: JSON.stringify(message),
		});
		if (!res.ok) {
			const text = await res.text();
			console.error('broadcastPush error', res.status, text);
			return { ok: false, status: res.status, message: text };
		}
		const json = await res.json();
		return { ok: true, result: json };
	} catch (e: any) {
		console.error('broadcastPush exception', e);
		return { ok: false, message: e?.message || String(e) };
	}
};