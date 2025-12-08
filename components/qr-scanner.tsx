'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Keyboard, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QRScannerProps {
  onCodeSubmit: (code: string) => Promise<{ success: boolean; message: string }>;
  className?: string;
}

type ScanMode = 'camera' | 'manual';
type ScanStatus = 'idle' | 'scanning' | 'success' | 'error';

export function QRScanner({ onCodeSubmit, className }: QRScannerProps) {
  const [mode, setMode] = React.useState<ScanMode>('manual');
  const [status, setStatus] = React.useState<ScanStatus>('idle');
  const [message, setMessage] = React.useState('');
  const [manualCode, setManualCode] = React.useState('');
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const stopCamera = React.useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = React.useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setMessage('Unable to access camera. Please use manual entry.');
      setMode('manual');
    }
  }, []);

  React.useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return stopCamera;
  }, [mode, startCamera, stopCamera]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    setStatus('scanning');
    setMessage('');

    try {
      const result = await onCodeSubmit(manualCode.toUpperCase());
      setStatus(result.success ? 'success' : 'error');
      setMessage(result.message);
      
      if (result.success) {
        setManualCode('');
      }
    } catch (err) {
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className={cn('max-w-md mx-auto', className)}>
      {/* Mode Switcher */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={mode === 'manual' ? 'default' : 'outline'}
          onClick={() => setMode('manual')}
          className="flex-1 gap-2"
        >
          <Keyboard className="h-4 w-4" />
          Enter Code
        </Button>
        <Button
          variant={mode === 'camera' ? 'default' : 'outline'}
          onClick={() => setMode('camera')}
          className="flex-1 gap-2"
        >
          <Camera className="h-4 w-4" />
          Scan QR
        </Button>
      </div>

      {/* Scanner Area */}
      <div className="relative">
        {mode === 'camera' ? (
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-square">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-white/50 rounded-2xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
                {/* Scanning line */}
                <div className="absolute inset-x-4 h-0.5 bg-primary/50 animate-pulse top-1/2" />
              </div>
            </div>
            <p className="absolute bottom-4 left-0 right-0 text-center text-white text-sm">
              Point camera at QR code
            </p>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className="text-center text-2xl font-mono tracking-[0.5em] h-16 uppercase"
                maxLength={6}
                disabled={status === 'scanning'}
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12"
              disabled={manualCode.length < 6 || status === 'scanning'}
            >
              {status === 'scanning' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check In'
              )}
            </Button>
          </form>
        )}
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={cn(
            'mt-6 p-4 rounded-xl flex items-center gap-3 animate-fade-in',
            status === 'success' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            status === 'error' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          )}
        >
          {status === 'success' ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}

      {/* Help Text */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Get the attendance code from your teacher&apos;s screen or scan the QR code displayed in class.
      </p>
    </div>
  );
}

