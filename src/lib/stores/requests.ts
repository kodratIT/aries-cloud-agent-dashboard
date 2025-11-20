import { writable } from 'svelte/store';

export interface CredentialRequest {
	id: string;
	use_case_id: string;
	cred_def_id: string;
	connection_id?: string;
	holder_name: string;
	request_data: Record<string, any>;
	status: 'pending' | 'issued' | 'rejected';
	created_at: string;
	updated_at?: string;
}

// In-memory store for demo (replace with database in production)
export const credentialRequests = writable<CredentialRequest[]>([]);

export function addRequest(request: Omit<CredentialRequest, 'id' | 'status' | 'created_at'>) {
	const newRequest: CredentialRequest = {
		id: crypto.randomUUID(),
		...request,
		status: 'pending',
		created_at: new Date().toISOString()
	};

	credentialRequests.update((requests) => [...requests, newRequest]);
	return newRequest;
}

export function updateRequestStatus(id: string, status: CredentialRequest['status']) {
	credentialRequests.update((requests) =>
		requests.map((r) =>
			r.id === id ? { ...r, status, updated_at: new Date().toISOString() } : r
		)
	);
}

export function getRequestById(id: string) {
	let request: CredentialRequest | undefined;
	credentialRequests.subscribe((requests) => {
		request = requests.find((r) => r.id === id);
	})();
	return request;
}
