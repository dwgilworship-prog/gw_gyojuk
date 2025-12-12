import { Student } from "@shared/schema";

// Types
export interface SmsTemplate {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface SmsRecipient {
  name: string;
  phone: string;
  status: 'success' | 'failed' | 'pending';
  studentId: string;
  type: 'student' | 'parent';
}

export interface SmsHistory {
  id: string;
  sentAt: string;
  type: 'SMS' | 'LMS';
  title?: string;
  content: string;
  recipientCount: number;
  successCount: number;
  failCount: number;
  status: 'completed' | 'scheduled' | 'failed' | 'cancelled';
  scheduledAt?: string;
  recipients: SmsRecipient[];
}

export interface SmsHistoryFilter {
  startDate?: Date;
  endDate?: Date;
  type?: 'ALL' | 'SMS' | 'LMS';
  status?: 'ALL' | 'completed' | 'scheduled' | 'failed' | 'cancelled';
  searchQuery?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Constants
export const SMS_MAX_BYTES = 90;

// Byte Calculation (Korean 2 bytes, others 1 byte)
export const calculateBytes = (text: string): number => {
  let bytes = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Korean characters passed to the server usually take 2 bytes in EUC-KR or similar legacy SMS systems
    // In UTF-8 it's 3 bytes, but usually SMS gateways count Korean as 2 bytes
    bytes += code > 127 ? 2 : 1;
  }
  return bytes;
};

// Template Processing
export const processTemplate = (template: string, student: Student): string => {
  let result = template;
  result = result.replace(/%이름%/g, student.name);
  result = result.replace(/%학년%/g, student.grade || "");
  // Note: Mokjang name usually needs looking up from mokjangId, passed separately if needed.
  // For simplicity in this Utils, we might need the caller to replace %목장% if they have the name.
  return result;
};

// Local Storage Helpers
const STORAGE_KEYS = {
  TEMPLATES: 'sms_templates',
  HISTORY: 'sms_history',
};

export const getTemplates = (): SmsTemplate[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load templates", e);
    return [];
  }
};

export const saveTemplate = (template: SmsTemplate) => {
  const templates = getTemplates();
  const existingIndex = templates.findIndex(t => t.id === template.id);

  if (existingIndex >= 0) {
    templates[existingIndex] = template;
  } else {
    templates.push(template);
  }

  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
};

export const deleteTemplate = (id: string) => {
  const templates = getTemplates().filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
};

export const getHistory = (): SmsHistory[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

export const saveHistory = (item: SmsHistory) => {
  const history = getHistory();
  // Add to beginning
  history.unshift(item);
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
};

export const updateHistoryStatus = (id: string, status: SmsHistory['status']) => {
  const history = getHistory();
  const item = history.find(h => h.id === id);
  if (item) {
    item.status = status;
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }
};

export const filterAndPaginateHistory = (
  history: SmsHistory[],
  filter: SmsHistoryFilter,
  page: number = 1,
  pageSize: number = 10
): PaginatedResult<SmsHistory> => {
  let filtered = [...history];

  // 1. Date Range Filter
  if (filter.startDate || filter.endDate) {
    filtered = filtered.filter(item => {
      const itemDate = new Date(item.sentAt || item.scheduledAt || '');
      if (filter.startDate && itemDate < filter.startDate) return false;
      // Set end date to end of day if provided
      if (filter.endDate) {
        const endOfDay = new Date(filter.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (itemDate > endOfDay) return false;
      }
      return true;
    });
  }

  // 2. Type Filter
  if (filter.type && filter.type !== 'ALL') {
    filtered = filtered.filter(item => item.type === filter.type);
  }

  // 3. Status Filter
  if (filter.status && filter.status !== 'ALL') {
    filtered = filtered.filter(item => item.status === filter.status);
  }

  // 4. Search Query (Content or Title)
  if (filter.searchQuery) {
    const query = filter.searchQuery.toLowerCase();
    filtered = filtered.filter(item =>
      (item.content && item.content.toLowerCase().includes(query)) ||
      (item.title && item.title.toLowerCase().includes(query))
    );
  }

  // 5. Pagination
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  // Ensure page is within valid range
  const safePage = Math.max(1, Math.min(page, totalPages || 1));
  const startIndex = (safePage - 1) * pageSize;
  const paginatedData = filtered.slice(startIndex, startIndex + pageSize);

  return {
    data: paginatedData,
    total,
    page: safePage,
    pageSize,
    totalPages
  };
};
