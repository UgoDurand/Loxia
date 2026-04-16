import axiosInstance from './axiosInstance'

export interface ConversationSummary {
  id: string
  listingId: string
  listingTitle: string
  tenantId: string
  tenantName: string
  ownerId: string
  ownerName: string
  createdAt: string
  updatedAt: string
  lastMessage: string | null
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  content: string
  createdAt: string
}

export interface StartConversationData {
  listingId: string
  listingTitle: string
  ownerId: string
  ownerName: string
}

export const chatApi = {
  getConversations: () =>
    axiosInstance.get<ConversationSummary[]>('/api/chat/conversations').then((r) => r.data),

  startConversation: (data: StartConversationData) =>
    axiosInstance.post<ConversationSummary>('/api/chat/conversations', data).then((r) => r.data),

  getMessages: (conversationId: string) =>
    axiosInstance
      .get<ChatMessage[]>(`/api/chat/conversations/${conversationId}/messages`)
      .then((r) => r.data),
}
