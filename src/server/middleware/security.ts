import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger, createChildLogger, logSecurityEvent } from '../../src/lib/logging/logger';

declare global {
  namespace Express {
    interface Request {
      cspNonce?: string;
    }
  }
}

const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'strict-dynamic'"],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'connect-src': ["'self'", 'https://*.googleapis.com', 'https://*.google.com', 'wss://*.supabase.co', 'https://*.supabase.co'],
  'frame-src': ["'none'"],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'object-src': ["'none'"],
  'media-src': ["'self'", 'blob:'],
  'worker-src': ["'self'", 'blob:'],
  'manifest-src': ["'self'"],
  'prefetch-src': ["'self'"],
} as const;

function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

function buildCspHeader(nonce: string): string {
  const directives = { ...CSP_DIRECTIVES };
  directives['script-src'] = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];
  directives['style-src'] = ["'self'", `'nonce-${nonce}'`, 'https://fonts.googleapis.com'];

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

export function cspMiddleware(req: Request, res: Response, next: NextFunction) {
  const nonce = generateNonce();
  req.cspNonce = nonce;

  const cspHeader = buildCspHeader(nonce);
  res.setHeader('Content-Security-Policy', cspHeader);

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), fullscreen=(self), payment=(), accelerometer=(), gyroscope=()'
  );

  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

  next();
}

export function getCspNonce(req: Request): string {
  return req.cspNonce || '';
}

export function reportOnlyCspMiddleware(req: Request, res: Response, next: NextFunction) {
  const nonce = generateNonce();
  req.cspNonce = nonce;

  const cspHeader = buildCspHeader(nonce) + '; report-uri /api/security/csp-report';
  res.setHeader('Content-Security-Policy-Report-Only', cspHeader);

  next();
}

export { buildCspHeader, generateNonce };