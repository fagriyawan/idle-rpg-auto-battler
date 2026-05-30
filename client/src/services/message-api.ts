const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const TOKEN_KEY = 'idle_rpg_token';

export interface PlayerMessage {
  id: string;
  sender: string;
  title: string;
  body: string;
  rewardType: string | null;
  rewardAmount: number;
  claimed: boolean;
  read: boolean;
  createdAt: string;
}

export interface MessagesResponse {
  messages: PlayerMessage[];
  unreadCount: number;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/';
    throw new Error('Session expired');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error || `Request failed: ${response.statusText}`);
  }
  return response.json();
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function getMessages(token: string): Promise<MessagesResponse> {
  const response = await fetch(`${API_BASE_URL}/api/player/messages`, {
    headers: authHeaders(token),
  });
  return handleResponse<MessagesResponse>(response);
}

export async function getUnreadCount(token: string): Promise<{ unreadCount: number }> {
  const response = await fetch(`${API_BASE_URL}/api/player/messages/unread-count`, {
    headers: authHeaders(token),
  });
  return handleResponse<{ unreadCount: number }>(response);
}

export async function markAsRead(token: string, messageId: string): Promise<PlayerMessage> {
  const response = await fetch(`${API_BASE_URL}/api/player/messages/${messageId}/read`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return handleResponse<PlayerMessage>(response);
}

export async function claimReward(token: string, messageId: string): Promise<PlayerMessage> {
  const response = await fetch(`${API_BASE_URL}/api/player/messages/${messageId}/claim`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return handleResponse<PlayerMessage>(response);
}

export async function deleteMessage(token: string, messageId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/player/messages/${messageId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await handleResponse<{ success: boolean }>(response);
}
