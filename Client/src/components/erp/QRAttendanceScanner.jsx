import { useState, useRef, useEffect } from "react";
import { Camera, Scan, X, CheckCircle, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { BrowserMultiFormatReader } from '@zxing/browser';
import { enqueueOfflineQrScan, flushOfflineQrQueue } from "@/data/attendanceApi";

export function QRAttendanceScanner({ 
  onScan, 
  onClose, 
  isOpen = false, 
  attendanceDate,
  onlineStatus = true 
}) {
  const [error, setError] = useState(null);
  const [lastScan, setLastScan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentScans, setRecentScans] = useState(new Set());
  const [cameraReady, setCameraReady] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const scanningRef = useRef(false);

  const stopCameraStream = () => {
    const stream = videoRef.current?.srcObject;
    if (stream && typeof stream.getTracks === "function") {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const stopScanner = () => {
    try {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    } catch (err) {
      console.warn("Scanner reset warning:", err);
    } finally {
      stopCameraStream();
      codeReaderRef.current = null;
      scanningRef.current = false;
      setCameraReady(false);
    }
  };

  const playTone = (frequency, duration = 100) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      oscillator.connect(gain);
      gain.connect(audioCtx.destination);
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration / 1000);
      oscillator.onended = () => audioCtx.close();
    } catch (err) {
      // ignore audio errors
    }
  };

  // Start QR Scanner
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    const initScanner = async () => {
      if (scanningRef.current) return;
      
      try {
        console.log("🎥 Initializing ZXing QR Scanner...");
        
        // Create code reader
        const codeReader = new BrowserMultiFormatReader();
        codeReaderRef.current = codeReader;

        if (!mounted) return;
        if (!videoRef.current) {
          throw new Error("Video element not ready");
        }

        const onDecode = (result, error) => {
          if (result) {
            const qrCode = result.getText();
            console.log("✅ QR Code detected:", qrCode);
            handleQRCodeDetected(qrCode);
          }
          // Ignore decode errors (common when no QR is visible)
        };

        // Start decoding from constraints (works across @zxing/browser versions)
        console.log("🚀 Starting camera...");

        // Prefer back camera when available; fallback to any camera
        try {
          await codeReader.decodeFromConstraints(
            { video: { facingMode: { ideal: "environment" } }, audio: false },
            videoRef.current,
            onDecode
          );
        } catch (err) {
          console.warn("⚠️ Back camera init failed, falling back:", err);
          await codeReader.decodeFromConstraints(
            { video: true, audio: false },
            videoRef.current,
            onDecode
          );
        }

        scanningRef.current = true;
        setCameraReady(true);
        console.log("✅ QR Scanner started successfully!");

      } catch (err) {
        console.error("❌ Scanner initialization error:", err);
        
        if (!mounted) return;

        let errorMsg = "د کیمرې پیل کولو کې ستونزه";
        
        if (err.name === 'NotAllowedError' || err.message.includes('Permission')) {
          errorMsg = "د کیمرې اجازه ورکړل شوې نه ده. مهرباني وکړئ د کیمرې اجازه ورکړئ.";
        } else if (err.message.includes('No camera found')) {
          errorMsg = "هیڅ کیمره ونه موندل شوه. ډاډ ترلاسه کړئ چې کیمره وصل ده.";
        } else if (err.name === 'NotReadableError') {
          errorMsg = "کیمره د بل اپلیکیشن لخوا کارول کیږي. مهرباني وکړئ نور اپلیکیشنونه وتړئ.";
        } else if (err.name === 'NotFoundError') {
          errorMsg = "کیمره ونه موندل شوه. ډاډ ترلاسه کړئ چې کیمره وصل او فعاله ده.";
        } else if (err.message?.includes("Video element not ready")) {
          errorMsg = "ویډیو چمتو نه ده. مهرباني وکړئ پاڼه بیا پرانیزئ.";
        }
        
        setError(errorMsg);
      }
    };

    initScanner();

    // Cleanup
    return () => {
      mounted = false;
      stopScanner();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const syncOfflineScans = async () => {
      if (!navigator.onLine) return;
      const result = await flushOfflineQrQueue();
      if (result.processed > 0) {
        toast.success(`${result.processed} آفلاین سکینونه ثبت شول`);
      }
    };
    syncOfflineScans();
  }, [isOpen]);

  // Handle QR Code Detection
  const handleQRCodeDetected = async (qrCode) => {
    // Prevent duplicate scans
    if (recentScans.has(qrCode)) {
      console.log("⏭️ Duplicate scan ignored:", qrCode);
      return;
    }

    if (isProcessing) {
      console.log("⏳ Already processing, ignoring scan");
      return;
    }

    try {
      setIsProcessing(true);
      setLastScan(qrCode);
      setScanCount(prev => prev + 1);

      // Add to recent scans
      setRecentScans(prev => new Set([...prev, qrCode]));

      // Remove from recent scans after 5 seconds
      setTimeout(() => {
        setRecentScans(prev => {
          const newSet = new Set(prev);
          newSet.delete(qrCode);
          return newSet;
        });
      }, 5000);

      console.log("📤 Processing QR Code:", qrCode);

      // Call API to mark attendance (works offline-first by queueing on failure)
      console.log("📞 Calling attendance API...");
      await onScan(qrCode);
      console.log("✅ Attendance marked successfully!");
      playTone(880, 120);

    } catch (err) {
      console.error("❌ Error processing QR code:", err);
      if (!navigator.onLine || err?.status === 0) {
        const queued = enqueueOfflineQrScan({
          qrCode,
          attendanceDate,
          source: "camera",
        });
        if (queued) {
          playTone(660, 100);
          toast.warning("آفلاین حالت - سکین ذخیره شو او وروسته به ثبت شي");
        } else {
          toast.info("نن ورځې لپاره دا QR مخکې آفلاین ذخیره شوی");
        }
      } else {
        playTone(220, 120);
        toast.error(err.message || "د QR کوډ په پروسس کولو کې ستونزه");
      }
    } finally {
      setIsProcessing(false);
      
      // Clear last scan after 3 seconds
      setTimeout(() => {
        setLastScan(null);
      }, 3000);
    }
  };

  // Handle close — always notify parent even if camera teardown throws
  const handleClose = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    stopScanner();
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Scan className="size-6 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">QR کوډ سکین کول</h3>
              <p className="text-xs text-muted-foreground">
                {scanCount > 0 ? `${scanCount} سکین شوي` : 'د سکین کولو لپاره چمتو'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onlineStatus ? (
              <Wifi className="size-4 text-success" title="آنلاین" />
            ) : (
              <WifiOff className="size-4 text-warning" title="آفلاین" />
            )}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close scanner"
              className="relative z-10 p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Scanner Area */}
        <div className="p-4">
          {error ? (
            // Error State
            <div className="text-center py-12">
              <AlertCircle className="size-16 mx-auto mb-4 text-destructive" />
              <p className="text-sm text-destructive mb-6 px-4">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  window.location.reload();
                }}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                بیا هڅه وکړئ
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Camera View */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-auto"
                  style={{ maxHeight: '400px' }}
                />
                
                {/* Scanning Box Overlay */}
                {cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-64 h-64 border-4 border-primary rounded-lg">
                      {/* Corner decorations */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                      
                      {/* Scanning line */}
                      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary animate-pulse"></div>
                    </div>
                  </div>
                )}
                
                {/* Loading Overlay */}
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <div className="text-center text-white">
                      <Camera className="size-16 mx-auto mb-3 animate-pulse" />
                      <p className="text-base font-medium">د کیمرې پیل کول...</p>
                      <p className="text-xs mt-2 text-gray-300">مهرباني وکړئ انتظار وکړئ</p>
                    </div>
                  </div>
                )}
                
                {/* Processing Indicator */}
                {isProcessing && (
                  <div className="absolute top-4 left-4 right-4">
                    <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-lg">
                      <div className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse"></div>
                      پروسس کول...
                    </div>
                  </div>
                )}
                
                {/* Success Indicator */}
                {lastScan && !isProcessing && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-success text-success-foreground px-4 py-3 rounded-lg text-sm font-medium text-center shadow-lg">
                      <CheckCircle className="size-5 inline mr-2" />
                      <span className="font-bold">سکین شو!</span>
                      <p className="text-xs mt-1 opacity-90">{lastScan.substring(0, 30)}...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Camera className="size-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">QR کوډ د کیمرې مخ ته ونیسئ</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      د اتوماتیک سکین کولو لپاره انتظار وکړئ
                    </p>
                  </div>
                </div>
                
                {cameraReady && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                    <span className="text-xs text-success font-medium">کیمره فعاله ده</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              {scanCount > 0 && (
                <div className="text-center text-sm text-muted-foreground">
                  <p>ټول سکین شوي: <span className="font-bold text-foreground">{scanCount}</span></p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QRAttendanceScanner;
