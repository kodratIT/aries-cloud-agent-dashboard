import { browser } from '$app/environment';

export interface CreateWalletRequest {
	wallet_name: string;
	wallet_key: string;
	label?: string;
	wallet_type?: string;
	wallet_webhook_urls?: string[];
}

export interface CreateWalletResponse {
	wallet_id: string;
	token: string;
	created_at: string;
}

export interface GetTokenRequest {
	wallet_key: string;
}

export interface GetTokenResponse {
	token: string;
}

export interface Connection {
	connection_id: string;
	state: string;
	their_label?: string;
	created_at: string;
	updated_at: string;
}

export interface ConnectionsResponse {
	results: Connection[];
}

export interface BasicMessage {
	message_id: string;
	connection_id: string;
	content: string;
	sent_time: string;
	state: string;
}

export interface BasicMessagesResponse {
	results: BasicMessage[];
}

export interface CredentialDetail {
	cred_ex_id: string;
	state: string;
	connection_id: string;
	credential_definition_id?: string;
	schema_id?: string;
	credential?: {
		attrs?: Record<string, string>;
	};
	created_at: string;
	updated_at: string;
	revocation_id?: string;
	revoc_reg_id?: string;
}

export interface RevocationStatus {
	revoked: boolean;
}

class ACAPayClient {
	private baseUrl: string;

	constructor() {
		// Use proxy API in browser to avoid CORS
		this.baseUrl = browser ? '/api/acapy' : 'http://localhost:8021';
	}

	private getHeaders(tenantToken?: string): HeadersInit {
		const headers: HeadersInit = {
			'Content-Type': 'application/json'
		};

		if (tenantToken) {
			headers['Authorization'] = `Bearer ${tenantToken}`;
		}

		return headers;
	}

	private async handleResponse<T>(response: Response): Promise<T> {
		if (!response.ok) {
			const error = await response.text();
			throw new Error(`API Error: ${response.status} - ${error}`);
		}
		return response.json();
	}

	// ============ MULTI-TENANCY ============

	/**
	 * Create a new wallet (Register)
	 */
	async createWallet(data: CreateWalletRequest): Promise<CreateWalletResponse> {
		const response = await fetch(`${this.baseUrl}/multitenancy/wallet`, {
			method: 'POST',
			headers: this.getHeaders(),
			body: JSON.stringify(data)
		});
		return this.handleResponse<CreateWalletResponse>(response);
	}

	/**
	 * Get wallet token (Login)
	 */
	async getWalletToken(walletId: string, walletKey: string): Promise<GetTokenResponse> {
		const response = await fetch(`${this.baseUrl}/multitenancy/wallet/${walletId}/token`, {
			method: 'POST',
			headers: this.getHeaders(),
			body: JSON.stringify({ wallet_key: walletKey })
		});
		return this.handleResponse<GetTokenResponse>(response);
	}

	/**
	 * Get wallet details
	 */
	async getWallet(walletId: string, tenantToken: string) {
		const response = await fetch(`${this.baseUrl}/multitenancy/wallet/${walletId}`, {
			method: 'GET',
			headers: this.getHeaders(tenantToken)
		});
		return this.handleResponse(response);
	}

	/**
	 * List all wallets (Admin only)
	 */
	async listWallets() {
		const response = await fetch(`${this.baseUrl}/multitenancy/wallets`, {
			method: 'GET',
			headers: this.getHeaders()
		});
		return this.handleResponse(response);
	}

	// ============ CONNECTIONS ============

	/**
	 * Get all connections for tenant
	 */
	async getConnections(tenantToken: string): Promise<ConnectionsResponse> {
		const response = await fetch(`${this.baseUrl}/connections`, {
			method: 'GET',
			headers: this.getHeaders(tenantToken)
		});
		return this.handleResponse<ConnectionsResponse>(response);
	}

	/**
	 * Get connection by ID
	 */
	async getConnection(connectionId: string, tenantToken: string) {
		const response = await fetch(`${this.baseUrl}/connections/${connectionId}`, {
			method: 'GET',
			headers: this.getHeaders(tenantToken)
		});
		return this.handleResponse(response);
	}

	/**
	 * Create out-of-band invitation
	 */
	async createInvitation(tenantToken: string, data?: any) {
		const defaultData = {
			handshake_protocols: ['https://didcomm.org/didexchange/1.0'],
			use_public_did: false,
			...data
		};
		
		const response = await fetch(`${this.baseUrl}/out-of-band/create-invitation`, {
			method: 'POST',
			headers: this.getHeaders(tenantToken),
			body: JSON.stringify(defaultData)
		});
		return this.handleResponse(response);
	}

	/**
	 * Receive invitation
	 */
	async receiveInvitation(tenantToken: string, invitation: any) {
		const response = await fetch(`${this.baseUrl}/out-of-band/receive-invitation`, {
			method: 'POST',
			headers: this.getHeaders(tenantToken),
			body: JSON.stringify(invitation)
		});
		return this.handleResponse(response);
	}

	/**
	 * Accept a connection request
	 */
	async acceptConnectionRequest(connectionId: string, tenantToken: string) {
		const response = await fetch(`${this.baseUrl}/didexchange/${connectionId}/accept-request`, {
			method: 'POST',
			headers: this.getHeaders(tenantToken)
		});
		return this.handleResponse(response);
	}

	/**
	 * Reject/delete a connection request
	 */
	async rejectConnectionRequest(connectionId: string, tenantToken: string) {
		const response = await fetch(`${this.baseUrl}/connections/${connectionId}`, {
			method: 'DELETE',
			headers: this.getHeaders(tenantToken)
		});
		return this.handleResponse(response);
	}

	// ============ BASIC MESSAGES ============

	/**
	 * Get basic messages for a connection
	 * Note: ACA-Py does not store basic message history by default.
	 * Messages are ephemeral and would need webhook integration to persist.
	 */
	async getConnectionMessages(connectionId: string, tenantToken: string): Promise<BasicMessagesResponse> {
		// Basic messages are not stored in ACA-Py by default
		// Return empty array for now - would need webhook integration to persist messages
		return { results: [] };
	}

	/**
	 * Send a basic message to a connection
	 */
	async sendBasicMessage(connectionId: string, content: string, tenantToken: string) {
		const response = await fetch(`${this.baseUrl}/connections/${connectionId}/send-message`, {
			method: 'POST',
			headers: this.getHeaders(tenantToken),
			body: JSON.stringify({ content })
		});
		return this.handleResponse(response);
	}

	// ============ CREDENTIALS ============

	/**
	 * Get credential records
	 */
	async getCredentials(tenantToken: string) {
		const response = await fetch(`${this.baseUrl}/issue-credential-2.0/records`, {
			method: 'GET',
			headers: this.getHeaders(tenantToken)
		});
		return this.handleResponse(response);
	}

	/**
	 * Issue credential
	 */
	async issueCredential(tenantToken: string, data: any) {
		const response = await fetch(`${this.baseUrl}/issue-credential-2.0/send`, {
			method: 'POST',
			headers: this.getHeaders(tenantToken),
			body: JSON.stringify(data)
		});
		return this.handleResponse(response);
	}

	/**
	 * Get detailed credential information including attributes
	 */
	async getCredentialDetails(credExId: string, tenantToken: string): Promise<CredentialDetail> {
		const response = await fetch(`${this.baseUrl}/issue-credential-2.0/records/${credExId}`, {
			method: 'GET',
			headers: this.getHeaders(tenantToken)
		});
		return this.handleResponse<CredentialDetail>(response);
	}

	/**
	 * Accept a credential offer (holder)
	 */
	async acceptCredentialOffer(credExId: string, tenantToken: string) {
		const response = await fetch(`${this.baseUrl}/issue-credential-2.0/records/${credExId}/send-request`, {
			method: 'POST',
			headers: this.getHeaders(tenantToken)
		});
		return this.handleResponse(response);
	}

	/**
	 * Decline a credential offer (holder)
	 */
	async declineCredentialOffer(credExId: string, tenantToken: string) {
		const response = await fetch(`${this.baseUrl}/issue-credential-2.0/records/${credExId}/problem-report`, {
			method: 'POST',
			headers: this.getHeaders(tenantToken),
			body: JSON.stringify({ description: 'Offer declined by holder' })
		});
		return this.handleResponse(response);
	}

	/**
	 * Revoke a credential (issuer)
	 */
	async revokeCredential(credExId: string, tenantToken: string, options?: {
		notify?: boolean;
		connectionId?: string;
		publish?: boolean;
	}) {
		const body: any = {
			cred_ex_id: credExId,
			publish: options?.publish ?? true, // Publish immediately by default
		};
		
		if (options?.notify && options?.connectionId) {
			body.notify = true;
			body.connection_id = options.connectionId;
			body.notify_version = 'v2_0';
		}
		
		const response = await fetch(`${this.baseUrl}/revocation/revoke`, {
			method: 'POST',
			headers: this.getHeaders(tenantToken),
			body: JSON.stringify(body)
		});
		return this.handleResponse(response);
	}

	/**
	 * Delete a credential exchange record
	 */
	async deleteCredentialRecord(credExId: string, tenantToken: string) {
		const response = await fetch(`${this.baseUrl}/issue-credential-2.0/records/${credExId}`, {
			method: 'DELETE',
			headers: this.getHeaders(tenantToken)
		});
		return this.handleResponse(response);
	}

	/**
	 * Check revocation status of a credential
	 */
	async checkRevocationStatus(credExId: string, tenantToken: string): Promise<RevocationStatus> {
		const credDetail = await this.getCredentialDetails(credExId, tenantToken);
		
		if (!credDetail.revocation_id || !credDetail.revoc_reg_id) {
			return { revoked: false };
		}

		const response = await fetch(
			`${this.baseUrl}/revocation/credential-record?cred_ex_id=${credExId}`,
			{
				method: 'GET',
				headers: this.getHeaders(tenantToken)
			}
		);
		const result = await this.handleResponse<any>(response);
		return { revoked: result.revoked || false };
	}

	// ============ SCHEMAS ============

	/**
	 * Get all schemas
	 */
	async getSchemas(tenantToken: string) {
		const response = await fetch(`${this.baseUrl}/anoncreds/schemas`, {
			method: 'GET',
			headers: this.getHeaders(tenantToken)
		});
		return this.handleResponse(response);
	}

	/**
	 * Create schema
	 */
	async createSchema(tenantToken: string, data: any) {
		const response = await fetch(`${this.baseUrl}/anoncreds/schema`, {
			method: 'POST',
			headers: this.getHeaders(tenantToken),
			body: JSON.stringify(data)
		});
		return this.handleResponse(response);
	}

	/**
	 * Get schema by ID
	 */
	async getSchemaById(tenantToken: string, schemaId: string) {
		const response = await fetch(`${this.baseUrl}/anoncreds/schema/${encodeURIComponent(schemaId)}`, {
			method: 'GET',
			headers: this.getHeaders(tenantToken)
		});
		return this.handleResponse(response);
	}

	// ============ CREDENTIAL DEFINITIONS ============

	/**
	 * Get all credential definitions
	 */
	async getCredentialDefinitions(tenantToken: string) {
		const response = await fetch(`${this.baseUrl}/anoncreds/credential-definitions`, {
			method: 'GET',
			headers: this.getHeaders(tenantToken)
		});
		return this.handleResponse(response);
	}

	/**
	 * Create credential definition
	 */
	async createCredentialDefinition(tenantToken: string, data: any) {
		const response = await fetch(`${this.baseUrl}/anoncreds/credential-definition`, {
			method: 'POST',
			headers: this.getHeaders(tenantToken),
			body: JSON.stringify(data)
		});
		return this.handleResponse(response);
	}

	/**
	 * Get credential definition by ID
	 */
	async getCredDefById(tenantToken: string, credDefId: string) {
		const response = await fetch(`${this.baseUrl}/anoncreds/credential-definition/${encodeURIComponent(credDefId)}`, {
			method: 'GET',
			headers: this.getHeaders(tenantToken)
		});
		return this.handleResponse(response);
	}

	// ============ WALLET & DID ============

	/**
	 * Get DIDs in wallet
	 */
	async getDIDs(tenantToken: string) {
		const response = await fetch(`${this.baseUrl}/wallet/did`, {
			method: 'GET',
			headers: this.getHeaders(tenantToken)
		});
		return this.handleResponse(response);
	}

	/**
	 * Create DID
	 */
	async createDID(tenantToken: string, data?: any) {
		const response = await fetch(`${this.baseUrl}/wallet/did/create`, {
			method: 'POST',
			headers: this.getHeaders(tenantToken),
			body: JSON.stringify(data || {})
		});
		return this.handleResponse(response);
	}

	/**
	 * Set public DID
	 */
	async setPublicDID(tenantToken: string, did: string) {
		const response = await fetch(`${this.baseUrl}/wallet/did/public?did=${encodeURIComponent(did)}`, {
			method: 'POST',
			headers: this.getHeaders(tenantToken)
		});
		return this.handleResponse(response);
	}

	// ============ PRESENTATIONS / PROOFS ============

	/**
	 * Get all presentation exchange records
	 */
	async getPresentations(tenantToken: string) {
		const response = await fetch(`${this.baseUrl}/present-proof-2.0/records`, {
			method: 'GET',
			headers: this.getHeaders(tenantToken)
		});
		return this.handleResponse(response);
	}

	/**
	 * Get presentation details by ID
	 */
	async getPresentationDetails(presExId: string, tenantToken: string) {
		const response = await fetch(`${this.baseUrl}/present-proof-2.0/records/${presExId}`, {
			method: 'GET',
			headers: this.getHeaders(tenantToken)
		});
		return this.handleResponse(response);
	}

	/**
	 * Send proof request (Verifier)
	 */
	async sendProofRequest(tenantToken: string, data: any) {
		const response = await fetch(`${this.baseUrl}/present-proof-2.0/send-request`, {
			method: 'POST',
			headers: this.getHeaders(tenantToken),
			body: JSON.stringify(data)
		});
		return this.handleResponse(response);
	}

	/**
	 * Get credentials that match proof request (Holder)
	 */
	async getCredentialsForProofRequest(presExId: string, tenantToken: string) {
		const response = await fetch(`${this.baseUrl}/present-proof-2.0/records/${presExId}/credentials`, {
			method: 'GET',
			headers: this.getHeaders(tenantToken)
		});
		return this.handleResponse(response);
	}

	/**
	 * Send presentation (Holder)
	 */
	async sendPresentation(presExId: string, tenantToken: string, data: any) {
		const response = await fetch(`${this.baseUrl}/present-proof-2.0/records/${presExId}/send-presentation`, {
			method: 'POST',
			headers: this.getHeaders(tenantToken),
			body: JSON.stringify(data)
		});
		return this.handleResponse(response);
	}

	/**
	 * Verify presentation (Verifier)
	 */
	async verifyPresentation(presExId: string, tenantToken: string) {
		const response = await fetch(`${this.baseUrl}/present-proof-2.0/records/${presExId}/verify-presentation`, {
			method: 'POST',
			headers: this.getHeaders(tenantToken)
		});
		return this.handleResponse(response);
	}

	/**
	 * Delete presentation record
	 */
	async deletePresentationRecord(presExId: string, tenantToken: string) {
		const response = await fetch(`${this.baseUrl}/present-proof-2.0/records/${presExId}`, {
			method: 'DELETE',
			headers: this.getHeaders(tenantToken)
		});
		return this.handleResponse(response);
	}

	// ============ STATUS ============

	/**
	 * Get agent status (public endpoint, no auth needed)
	 */
	async getStatus() {
		const response = await fetch(`${this.baseUrl}/status`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		return this.handleResponse(response);
	}

	/**
	 * Get agent status with tenant token
	 */
	async getStatusWithAuth(tenantToken: string) {
		const response = await fetch(`${this.baseUrl}/status`, {
			method: 'GET',
			headers: this.getHeaders(tenantToken)
		});
		return this.handleResponse(response);
	}
}

export const acapyClient = new ACAPayClient();
