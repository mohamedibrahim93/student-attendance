'use client';

import * as React from 'react';
import QRCode from 'qrcode';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { RefreshCw, Copy, Check } from 'lucide-react';
import { generateSessionCode } from '@/lib/utils';

interface QRGeneratorProps {
  classId: string;
  className?: string;
  onSessionCreated?: (sessionCode: string) => void;
}

export function QRGenerator({ classId, className, onSessionCreated }: QRGeneratorProps) {
  const t = useTranslations();
  const [qrDataUrl, setQrDataUrl] = React.useState<string>('');
  const [sessionCode, setSessionCode] = React.useState<string>('');
  const [expiresAt, setExpiresAt] = React.useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = React.useState<number>(0);
  const [copied, setCopied] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const generateQR = React.useCallback(async () => {
    setLoading(true);
    const code = generateSessionCode();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const qrContent = JSON.stringify({
      code,
      classId,
      expires: expiry.toISOString(),
    });

    try {
      const dataUrl = await QRCode.toDataURL(qrContent, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff',
        },
      });
      setQrDataUrl(dataUrl);
      setSessionCode(code);
      setExpiresAt(expiry);
      onSessionCreated?.(code);
    } catch (err) {
      console.error('QR generation error:', err);
    } finally {
      setLoading(false);
    }
  }, [classId, onSessionCreated]);

  React.useEffect(() => {
    generateQR();
  }, [generateQR]);

  React.useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, expiresAt.getTime() - now);
      setTimeLeft(Math.floor(remaining / 1000));

      if (remaining <= 0) {
        generateQR();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, generateQR]);

  const copyCode = async () => {
    await navigator.clipboard.writeText(sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className={className}>
      <div className="flex flex-col items-center">
        {/* QR Code Display */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 rounded-3xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity" />
          <div className="relative bg-white p-4 rounded-2xl shadow-2xl">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={t('qrGenerator.qrCodeAlt')}
                className="w-64 h-64 rounded-xl"
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-xl">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            )}
          </div>
        </div>

        {/* Session Code */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">{t('qrGenerator.sessionCode')}</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-mono font-bold tracking-widest text-primary">
              {sessionCode}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyCode}
              className="h-8 w-8"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Timer */}
        <div className="mt-4 flex items-center gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{t('qrGenerator.expiresIn')}</p>
            <p className={`text-2xl font-mono font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-foreground'}`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generateQR}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('qrGenerator.regenerate')}
          </Button>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-muted/50 rounded-xl max-w-sm">
          <p className="text-sm text-center text-muted-foreground">
            {t('qrGenerator.instructions')}
          </p>
        </div>
      </div>
    </div>
  );
}
