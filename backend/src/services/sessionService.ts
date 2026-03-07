export interface AdminSession {
  sessionId: string;
  lastHeartbeat: number;
}

export const HEARTBEAT_TIMEOUT_MS = 30 * 1000;

class SessionService {
  private activeSession: AdminSession | null = null;

  public getActiveSession(): AdminSession | null {
    return this.activeSession;
  }

  public setActiveSession(sessionId: string) {
    this.activeSession = { sessionId, lastHeartbeat: Date.now() };
  }

  public clearSession(sessionId?: string) {
    if (!sessionId || this.activeSession?.sessionId === sessionId) {
      this.activeSession = null;
    }
  }

  public heartbeat(sessionId: string) {
    if (this.activeSession?.sessionId === sessionId) {
      this.activeSession.lastHeartbeat = Date.now();
    } else if (!this.activeSession || Date.now() - this.activeSession.lastHeartbeat >= HEARTBEAT_TIMEOUT_MS) {
      // Recover session or take over if lock expired
      this.activeSession = { sessionId, lastHeartbeat: Date.now() };
    }
  }

  public isLockedFor(sessionId: string): boolean {
    if (!this.activeSession) return false;
    if (this.activeSession.sessionId === sessionId) return false;
    if (Date.now() - this.activeSession.lastHeartbeat > HEARTBEAT_TIMEOUT_MS) {
      return false; // Lock expired
    }
    return true; // Locked by another active session
  }
}

export const adminSessionService = new SessionService();
