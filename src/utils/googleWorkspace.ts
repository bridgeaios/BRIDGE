import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Scopes required for Workspace integration
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
];

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign-in with Google popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// ================= GOOGLE CALENDAR =================
export interface CalendarEventPayload {
  summary: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  location?: string;
}

export async function createCalendarEvent(event: CalendarEventPayload) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed into Google Workspace. Please sign in via Admin Setup.');

  const start = { date: event.startDate };
  const end = { date: event.endDate || event.startDate };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: `[LIFE HUB] ${event.summary}`,
      description: event.description || 'Created via Big Button Life Hub',
      start,
      end,
      location: event.location,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Google Calendar event');
  }

  return await res.json();
}

// ================= GOOGLE SHEETS =================
export interface SheetExportPayload {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export async function exportReportToGoogleSheet(payload: SheetExportPayload) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed into Google Workspace. Please sign in via Admin Setup.');

  // 1. Create a new Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: `Life Hub - ${payload.title} (${new Date().toISOString().split('T')[0]})`,
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Google Sheet');
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;

  // 2. Append rows to the spreadsheet
  const values = [payload.headers, ...payload.rows];
  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    }
  );

  if (!appendRes.ok) {
    const err = await appendRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to write data into Google Sheet');
  }

  return {
    spreadsheetId,
    spreadsheetUrl: sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  };
}

// ================= GOOGLE DRIVE =================
export interface DriveUploadPayload {
  name: string;
  mimeType: string;
  base64Data: string; // base64 encoded string or data URI
}

export async function uploadFileToGoogleDrive(payload: DriveUploadPayload) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed into Google Workspace. Please sign in via Admin Setup.');

  const cleanBase64 = payload.base64Data.replace(/^data:[^;]+;base64,/, '');
  const byteChars = atob(cleanBase64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: payload.mimeType || 'image/jpeg' });

  const metadata = {
    name: `LifeHub_${payload.name}`,
    mimeType: payload.mimeType || 'image/jpeg',
    description: 'Captured and saved from Big Button Life Hub',
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', blob);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to upload file to Google Drive');
  }

  const data = await res.json();
  return {
    fileId: data.id,
    webViewLink: `https://drive.google.com/file/d/${data.id}/view`,
  };
}

// ================= GMAIL =================
export interface SendEmailPayload {
  to: string;
  subject: string;
  bodyText: string;
}

export async function sendEmailWithGmail(payload: SendEmailPayload) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed into Google Workspace. Please sign in via Admin Setup.');

  const emailLines = [
    `To: ${payload.to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(payload.subject)))}?=`,
    '',
    payload.bodyText,
  ];

  const email = emailLines.join('\r\n');
  const base64EncodedEmail = btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: base64EncodedEmail,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to send email via Gmail');
  }

  return await res.json();
}
