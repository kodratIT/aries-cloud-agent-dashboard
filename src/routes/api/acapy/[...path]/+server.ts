import { PUBLIC_ACAPY_API_URL } from '$env/static/public';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url, request }) => {
	return proxyRequest('GET', params.path, url, request);
};

export const POST: RequestHandler = async ({ params, url, request }) => {
	return proxyRequest('POST', params.path, url, request);
};

export const PUT: RequestHandler = async ({ params, url, request }) => {
	return proxyRequest('PUT', params.path, url, request);
};

export const DELETE: RequestHandler = async ({ params, url, request }) => {
	return proxyRequest('DELETE', params.path, url, request);
};

export const PATCH: RequestHandler = async ({ params, url, request }) => {
	return proxyRequest('PATCH', params.path, url, request);
};

async function proxyRequest(
	method: string,
	path: string,
	url: URL,
	request: Request
): Promise<Response> {
	try {
		// Build target URL
		const targetUrl = `${PUBLIC_ACAPY_API_URL}/${path}${url.search}`;

		// Get headers from original request
		const headers: HeadersInit = {};
		
		// Copy relevant headers
		const authHeader = request.headers.get('Authorization');
		if (authHeader) {
			headers['Authorization'] = authHeader;
		}

		const contentType = request.headers.get('Content-Type');
		if (contentType) {
			headers['Content-Type'] = contentType;
		}

		// Get body for POST/PUT/PATCH
		let body: string | undefined;
		if (['POST', 'PUT', 'PATCH'].includes(method)) {
			body = await request.text();
		}

		// Make request to ACA-Py
		const response = await fetch(targetUrl, {
			method,
			headers,
			body
		});

		// Get response data
		const responseText = await response.text();
		let responseData;
		
		try {
			responseData = JSON.parse(responseText);
		} catch {
			responseData = responseText;
		}

		// Return response with CORS headers
		return new Response(JSON.stringify(responseData), {
			status: response.status,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization'
			}
		});
	} catch (err: any) {
		console.error('Proxy error:', err);
		return json({ error: err.message }, { status: 500 });
	}
}

// Handle OPTIONS for CORS preflight
export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization'
		}
	});
};
