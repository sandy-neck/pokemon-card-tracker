'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  onCapture: (blob: Blob, base64: string) => void
}

export default function CameraCapture({ onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setStreaming(true)
        setError(null)
      }
    } catch {
      setError('Camera access denied. Please allow camera access in your browser settings and try again.')
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
  }

  function capture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
        stopCamera()
        onCapture(blob, base64)
      },
      'image/jpeg',
      0.85
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-zinc-900 rounded-2xl border border-zinc-800 p-6 text-center">
        <p className="text-5xl mb-4">📷</p>
        <p className="text-zinc-400 text-sm mb-4">{error}</p>
        <button
          onClick={() => { setError(null); startCamera() }}
          className="bg-amber-400 text-black font-semibold px-5 py-2 rounded-xl text-sm"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-zinc-900">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full"
        style={{ maxHeight: '62vh', objectFit: 'cover' }}
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Card outline guide overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="border-2 border-amber-400/70 rounded-xl"
          style={{ width: '52%', aspectRatio: '2/3' }}
        />
      </div>

      {streaming && (
        <button
          onClick={capture}
          aria-label="Capture photo"
          className="absolute bottom-5 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white border-4 border-amber-400 shadow-lg active:scale-95 transition-transform"
        />
      )}
    </div>
  )
}
