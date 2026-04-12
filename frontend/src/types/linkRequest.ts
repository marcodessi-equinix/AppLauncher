export type LinkRequestStatus = 'open' | 'implemented';

export interface LinkRequestClientInfo {
  id: string;
  createdAt: string | null;
  lastSeen: string | null;
}

export interface LinkRequest {
  id: number;
  clientId: string;
  message: string;
  status: LinkRequestStatus;
  adminNote: string | null;
  requesterLabel: string | null;
  createdAt: string;
  updatedAt: string;
  client: LinkRequestClientInfo;
}