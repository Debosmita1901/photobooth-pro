import { useEffect, useRef, useState } from "react";

export type CameraStatus = "requesting" | "ready" | "denied" | "unavailable";

export type Facing = "user" | "environment";

/** Requests a camera and attaches the stream to a video element. Re-requests
 * when `facing` changes (front/back on phones) and cleans up on unmount. */
export function useCamera(facing: Facing = "user") {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("requesting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setStatus("requesting");
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unavailable");
        setErrorMessage("This browser can't access a camera.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setStatus("denied");
          setErrorMessage("Camera access was blocked. Allow camera access and try again.");
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setStatus("unavailable");
          setErrorMessage("No camera was found on this device.");
        } else {
          setStatus("unavailable");
          setErrorMessage("Couldn't start the camera. Please try again.");
        }
      }
    }

    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing]);

  /** Grabs the current frame as an unfiltered JPEG data URL (mirrored for the
   * front camera so it matches the preview). Looks are applied later, non-destructively. */
  function capture(mirror: boolean): string | null {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth) return null;
    const s = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * s);
    canvas.height = Math.round(video.videoHeight * s);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    if (mirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.92);
  }

  return { videoRef, status, errorMessage, capture };
}
