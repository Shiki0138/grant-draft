// ローカルストレージベースのデータ管理
export interface LocalDraft {
  id: string;
  title: string;
  content: {
    sections: Array<{
      heading: string;
      body: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export class LocalStorageManager {
  private static DRAFTS_KEY = 'grant-drafts';

  static saveDraft(draft: LocalDraft): void {
    const drafts = this.getAllDrafts();
    const existingIndex = drafts.findIndex(d => d.id === draft.id);
    
    if (existingIndex >= 0) {
      drafts[existingIndex] = { ...draft, updatedAt: new Date().toISOString() };
    } else {
      drafts.push(draft);
    }
    
    localStorage.setItem(this.DRAFTS_KEY, JSON.stringify(drafts));
  }

  static getAllDrafts(): LocalDraft[] {
    const data = localStorage.getItem(this.DRAFTS_KEY);
    return data ? JSON.parse(data) : [];
  }

  static getDraft(id: string): LocalDraft | null {
    const drafts = this.getAllDrafts();
    return drafts.find(d => d.id === id) || null;
  }

  static deleteDraft(id: string): void {
    const drafts = this.getAllDrafts().filter(d => d.id !== id);
    localStorage.setItem(this.DRAFTS_KEY, JSON.stringify(drafts));
  }

  static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}