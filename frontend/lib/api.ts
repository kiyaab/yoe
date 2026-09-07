const API_URL = typeof window !== 'undefined'
  ? '/api'
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  return data;
}

export const api = {
  // Public Lottery & Tickets
  getCurrentRound: () => request<any>('/lottery/current'),
  getRounds: () => request<any[]>('/lottery/rounds'),
  getTickets: (roundId?: string, telegramId?: string) => {
    const params = new URLSearchParams();
    if (roundId) params.append('roundId', roundId);
    if (telegramId) params.append('telegramId', telegramId);
    return request<any>(`/tickets?${params.toString()}`);
  },
  reserveTicket: (data: {
    ticketNumber: number;
    roundId?: string;
    telegramId: string;
    username?: string;
    firstName?: string;
    phone?: string;
  }) =>
    request<any>('/tickets/reserve', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMyTickets: (telegramId: string) =>
    request<any[]>(`/tickets/my?telegramId=${encodeURIComponent(telegramId)}`),

  // Payment & Receipts
  getPaymentMethods: () => request<any[]>('/settings/payment-methods/public'),
  createPayment: (data: {
    ticketId: string;
    method: 'CBE' | 'TELEBIRR';
    reference?: string;
    amount?: number;
  }) =>
    request<any>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  uploadReceipt: async (paymentId: string, file: File) => {
    const formData = new FormData();
    formData.append('paymentId', paymentId);
    formData.append('receipt', file);

    const response = await fetch(`${API_URL}/receipts/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Receipt upload failed');
    }
    return data;
  },

  // Winners
  getPublicWinners: () => request<any[]>('/winners'),
  getLatestWinners: () => request<any>('/winners/latest'),

  // User Auth
  userRegister: (data: {
    phone: string;
    firstName: string;
    lastName?: string;
    password: string;
    telegramUsername?: string;
  }) =>
    request<{ accessToken: string; user: any }>('/auth/user/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  userLogin: (credentials: { identifier: string; password: string }) =>
    request<{ accessToken: string; user: any }>('/auth/user/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getUserProfile: (token: string) =>
    request<any>('/auth/user/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Admin Auth
  adminLogin: (credentials: { email: string; password: string }) =>
    request<{ accessToken: string; admin: any }>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  // Admin Dashboard & Operations
  getAdminStats: (token: string) =>
    request<any>('/payments/dashboard-stats', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  getAdminPayments: (
    token: string,
    params?: { status?: string; method?: string; search?: string; skip?: number; take?: number }
  ) => {
    const query = new URLSearchParams(params as any);
    return request<{ total: number; payments: any[] }>(`/payments?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  reviewPayment: (
    token: string,
    id: string,
    status: 'APPROVED' | 'REJECTED',
    rejectionReason?: string
  ) =>
    request<any>(`/payments/${id}/review`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, rejectionReason }),
    }),

  // Admin Draws & Spin Wheel
  getDrawParticipants: (token: string, roundId: string) =>
    request<any>(`/draws/round/${roundId}/participants`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  executeDraw: (
    token: string,
    data: { roundId: string; position: 'FIRST_PRIZE' | 'SECOND_PRIZE' | 'THIRD_PRIZE' }
  ) =>
    request<any>('/draws/execute', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  // Admin Rounds Management
  getAdminRounds: (token: string) =>
    request<any[]>('/lottery/rounds', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  createRound: (token: string, data: any) =>
    request<any>('/lottery/rounds', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),
  updateRoundStatus: (token: string, id: string, status: string) =>
    request<any>(`/lottery/rounds/${id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    }),

  // Admin Users Management
  getAdminUsers: (token: string, params?: { skip?: number; take?: number; search?: string }) => {
    const query = new URLSearchParams(params as any);
    return request<{ total: number; users: any[] }>(`/users?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  updateUserStatus: (token: string, id: string, status: 'ACTIVE' | 'SUSPENDED') =>
    request<any>(`/users/${id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    }),

  // Admin Settings
  getAdminPaymentMethods: (token: string) =>
    request<any[]>('/settings/payment-methods', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  updatePaymentMethod: (token: string, code: string, data: any) =>
    request<any>(`/settings/payment-methods/${code}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  // Admin Audit Logs
  getAuditLogs: (token: string, params?: { skip?: number; take?: number; action?: string }) => {
    const query = new URLSearchParams(params as any);
    return request<{ total: number; logs: any[] }>(`/audit?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Telegram Bot Operations
  getTelegramStatus: () => request<any>('/telegram/status'),
  connectTelegramBot: (token: string) =>
    request<any>('/telegram/token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
  updateMiniAppUrl: (url: string) =>
    request<any>('/telegram/mini-app-url', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
};
