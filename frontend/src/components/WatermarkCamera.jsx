import { useEffect, useRef, useState } from 'react';
import { apiClient, authHeaders, errorMessage } from '../api/client';
import { CameraIcon, ShareIcon, CloseIcon } from './Icons';

const CAMERA_SUPPORTED = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

export default function WatermarkCamera({ tenantSlug, token, uploaderName, uploaderPhone, onUploaded }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [watermarkedBlob, setWatermarkedBlob] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | ready | uploading | done
  const [error, setError] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  // Stop the camera stream if the sheet closes / component unmounts while it's open.
  useEffect(() => stopCamera, []);

  useEffect(() => {
    if (cameraOpen && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOpen]);

  async function openCamera() {
    setError('');
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setCameraOpen(true);
    } catch {
      setError('Camera access was denied or unavailable — choose a photo instead.');
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const temp = document.createElement('canvas');
    temp.width = video.videoWidth;
    temp.height = video.videoHeight;
    temp.getContext('2d').drawImage(video, 0, 0, temp.width, temp.height);
    stopCamera();

    setError('');
    setUploadedUrl(null);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      drawWatermark(img);
    };
    img.src = temp.toDataURL('image/jpeg', 0.92);
  }

  function drawWatermark(img) {
    const canvas = canvasRef.current;
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const label = `${uploaderName || 'Guest'} • ${uploaderPhone || ''}`.replace(/•\s*$/, '').trim();
    const fontSize = Math.max(18, Math.round(img.width / 28));
    ctx.font = `bold ${fontSize}px sans-serif`;
    const textWidth = ctx.measureText(label).width;
    const paddingX = fontSize * 0.6;
    const paddingY = fontSize * 0.8;
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = fontSize + paddingY;
    const x = img.width - boxWidth - 16;
    const y = img.height - boxHeight - 16;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(x, y, boxWidth, boxHeight);
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + paddingX, y + boxHeight / 2);

    canvas.toBlob((blob) => {
      setWatermarkedBlob(blob);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
      setStatus('ready');
    }, 'image/jpeg', 0.92);
  }

  async function handleUpload() {
    if (!watermarkedBlob) {
      setError('Take a photo first.');
      return;
    }
    setStatus('uploading');
    setError('');
    try {
      const form = new FormData();
      form.append('image', watermarkedBlob, 'photo.jpg');
      form.append('caption', caption);
      // Let the browser set the multipart Content-Type (with boundary) itself —
      // setting it manually here strips the boundary and multer can't parse the body.
      const { data } = await apiClient.post(`/portal/${tenantSlug}/gallery/upload`, form, { headers: authHeaders(token) });
      setUploadedUrl(data.watermarkedImageUrl);
      setStatus('done');
      onUploaded?.(data);
    } catch (err) {
      setError(errorMessage(err, 'Upload failed. Please try again.'));
      setStatus('ready');
    }
  }

  async function handleShare() {
    if (!uploadedUrl) return;
    const absoluteUrl = new URL(uploadedUrl, window.location.origin).href;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Ganesh Utsav', text: '🙏 Check out my photo from the celebration!', url: absoluteUrl });
        return;
      } catch {
        // user cancelled the native share sheet — fall back to WhatsApp
      }
    }
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`🙏 Check out my photo: ${absoluteUrl}`)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    imgRef.current = null;
    setPreviewUrl(null);
    setWatermarkedBlob(null);
    setUploadedUrl(null);
    setCaption('');
    setStatus('idle');
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-spotify-gray">Sharing as <span className="text-spotify-text font-semibold">{uploaderName}</span></p>
      <input
        className="bg-spotify-dark3 text-spotify-text placeholder-spotify-gray rounded-xl px-3.5 py-2.5 text-sm outline-none"
        placeholder="Caption (optional)"
        maxLength={200}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />

      <canvas ref={canvasRef} className="hidden" />

      {cameraOpen ? (
        <div className="relative rounded-2xl overflow-hidden bg-black">
          <video ref={videoRef} playsInline muted className="w-full max-h-80 object-contain" />
          <button
            onClick={stopCamera}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
            aria-label="Close camera"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
          <button
            onClick={capturePhoto}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white border-4 border-white/40 active:scale-95 transition"
            aria-label="Take photo"
          />
        </div>
      ) : previewUrl ? (
        <div className="relative">
          <img src={previewUrl} alt="Watermarked preview" className="w-full rounded-2xl max-h-72 object-contain bg-spotify-dark3" />
          {status !== 'done' && (
            <button
              onClick={openCamera}
              className="absolute bottom-2 right-2 bg-black/70 backdrop-blur text-xs font-semibold text-white rounded-full px-3 py-1.5"
            >
              Retake
            </button>
          )}
        </div>
      ) : CAMERA_SUPPORTED ? (
        <button
          onClick={openCamera}
          className="border-2 border-dashed border-spotify-dark3 rounded-2xl py-8 flex flex-col items-center gap-2 text-spotify-green active:scale-[0.99] transition"
        >
          <CameraIcon className="w-8 h-8" />
          <span className="text-sm font-semibold">Take photo</span>
        </button>
      ) : (
        <p className="text-center text-sm text-spotify-gray py-8 border-2 border-dashed border-spotify-dark3 rounded-2xl px-4">
          A camera is required to share a photo here. Please open this page on a device/browser with camera access.
        </p>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!cameraOpen && (status !== 'done' ? (
        <button
          onClick={handleUpload}
          disabled={!watermarkedBlob || status === 'uploading'}
          className="bg-spotify-green text-black rounded-full py-3 font-bold disabled:opacity-40 active:scale-[0.99] transition"
        >
          {status === 'uploading' ? 'Uploading…' : 'Upload photo'}
        </button>
      ) : (
        <div className="flex gap-2">
          <button onClick={handleShare} className="flex-1 bg-spotify-green text-black rounded-full py-3 font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition">
            <ShareIcon className="w-4 h-4" /> Share
          </button>
          <button onClick={reset} className="px-5 rounded-full border border-spotify-dark3 font-semibold text-spotify-text">
            New
          </button>
        </div>
      ))}
      {status === 'done' && (
        <p className="text-sm text-spotify-green text-center">Uploaded! It'll appear in the gallery once approved.</p>
      )}
    </div>
  );
}
