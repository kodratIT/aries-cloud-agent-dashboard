import { browser } from '$app/environment';

interface AuthState {
	walletId: string | null;
	token: string | null;
	isAuthenticated: boolean;
}

function createAuthStore() {
	let state = $state<AuthState>({
		walletId: null,
		token: null,
		isAuthenticated: false
	});

	// Load from localStorage on init
	if (browser) {
		const savedWalletId = localStorage.getItem('wallet_id');
		const savedToken = localStorage.getItem('token');

		if (savedWalletId && savedToken) {
			state.walletId = savedWalletId;
			state.token = savedToken;
			state.isAuthenticated = true;
		}
	}

	return {
		get walletId() {
			return state.walletId;
		},
		get token() {
			return state.token;
		},
		get isAuthenticated() {
			return state.isAuthenticated;
		},

		login(walletId: string, token: string) {
			state.walletId = walletId;
			state.token = token;
			state.isAuthenticated = true;

			if (browser) {
				localStorage.setItem('wallet_id', walletId);
				localStorage.setItem('token', token);
			}
		},

		logout() {
			state.walletId = null;
			state.token = null;
			state.isAuthenticated = false;

			if (browser) {
				localStorage.removeItem('wallet_id');
				localStorage.removeItem('token');
			}
		}
	};
}

export const authStore = createAuthStore();
