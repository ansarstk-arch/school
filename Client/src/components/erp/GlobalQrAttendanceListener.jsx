import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import * as attendanceApi from "@/data/attendanceApi";
import { isAttendanceQrPayload } from "@/utils/attendanceQr";

/**
 * Listens for USB QR scanner (keyboard wedge) input app-wide.
 * Does not render UI — no UX change.
 */
export function GlobalQrAttendanceListener() {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const bufferRef = useRef("");
  const lastKeyAtRef = useRef(0);
  const processingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    window.__attendanceUsbScannerActive = true;
    window.dispatchEvent(
      new CustomEvent("attendance:usb-scanner-status", { detail: { active: true } })
    );

    const flushBuffer = async (raw) => {
      const code = raw.trim();
      bufferRef.current = "";
      if (!code || !isAttendanceQrPayload(code)) return;
      if (processingRef.current) return;

      processingRef.current = true;
      try {
        const response = await attendanceApi.qrAttendance({ qrCode: code });
        if (response?.success) {
          const action = response.data?.action;
          if (action === "already_marked_today" || action === "duplicate_scan") {
            toast.info(response.message || "دمخه ثبت شوی");
          } else {
            toast.success(response.message || "حاضرۍ ثبت شوه");
          }
        }
      } catch (err) {
        if (!navigator.onLine || err?.status === 0) {
          const queued = attendanceApi.enqueueOfflineQrScan({
            qrCode: code,
            attendanceDate: new Date().toISOString().slice(0, 10),
            source: "usb",
          });
          if (queued) {
            toast.warning("USB سکین آفلاین ذخیره شو");
          } else {
            toast.info("دا QR مخکې آفلاین ذخیره شوی");
          }
        } else {
          toast.error(err.message || "د QR حاضرۍ ثبتولو کې ستونزه");
        }
      } finally {
        processingRef.current = false;
      }
    };

    const onKeyDown = (e) => {
      const target = e.target;
      const tag = target?.tagName?.toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (e.key === "Enter") {
        if (bufferRef.current) {
          e.preventDefault();
          flushBuffer(bufferRef.current);
        }
        return;
      }

      if (e.key.length !== 1) return;

      const now = Date.now();
      if (now - lastKeyAtRef.current > 300) {
        bufferRef.current = "";
      }
      lastKeyAtRef.current = now;
      bufferRef.current += e.key;
    };

    window.addEventListener("keydown", onKeyDown);
    const handleOnlineSync = async () => {
      const result = await attendanceApi.flushOfflineQrQueue();
      if (result.processed > 0) {
        toast.success(`${result.processed} آفلاین USB سکینونه ثبت شول`);
      }
    };
    window.addEventListener("online", handleOnlineSync);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("online", handleOnlineSync);
      window.__attendanceUsbScannerActive = false;
      window.dispatchEvent(
        new CustomEvent("attendance:usb-scanner-status", { detail: { active: false } })
      );
    };
  }, [isAuthenticated]);

  return null;
}

export default GlobalQrAttendanceListener;
