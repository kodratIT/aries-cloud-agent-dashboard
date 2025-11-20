import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { credentialRequests, addRequest, updateRequestStatus } from '$lib/stores/requests';
import { get } from 'svelte/store';

export const GET: RequestHandler = async ({ url }) => {
	const status = url.searchParams.get('status');

	let requests = get(credentialRequests);

	if (status) {
		requests = requests.filter((r) => r.status === status);
	}

	return json({ requests });
};

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();

	const newRequest = addRequest(data);

	return json({ success: true, request: newRequest });
};

export const PUT: RequestHandler = async ({ request }) => {
	const { id, status } = await request.json();

	updateRequestStatus(id, status);

	return json({ success: true });
};
