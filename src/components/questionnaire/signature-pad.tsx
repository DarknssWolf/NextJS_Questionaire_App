'use client';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { CANVAS_COLORS } from '@/lib/chart-colors';

interface SignaturePadProps {
  onChange: (signatureData: string | null) => void;
  value?: string;
  width?: number;
  height?: number;
}

export function SignaturePad({
  onChange,
  value,
  height = 150,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.beginPath();
      context.moveTo(20, canvas.height - 30);
      context.lineTo(canvas.width - 20, canvas.height - 30);
      context.strokeStyle = CANVAS_COLORS.guide;
      context.lineWidth = 1;
      context.stroke();

      if (value && value.trim() !== '') {
        const img = new Image();
        img.onload = () => {
          context.drawImage(img, 0, 0, canvas.width, canvas.height);
          setHasSignature(true);
        };
        img.src = value;
      }
    };

    resize();
    window.addEventListener('resize', resize);

    return () => window.removeEventListener('resize', resize);
  }, [value]);

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    setIsDrawing(true);
    setHasSignature(true);

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);
    context.lineWidth = 2;
    context.strokeStyle = CANVAS_COLORS.ink;
    context.lineCap = 'round';
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault();
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);

      const canvas = canvasRef.current;
      if (canvas) {
        const signatureData = canvas.toDataURL('image/png');
        onChange(signatureData);
      }
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.beginPath();
    context.moveTo(20, canvas.height - 30);
    context.lineTo(canvas.width - 20, canvas.height - 30);
    context.strokeStyle = CANVAS_COLORS.guide;
    context.lineWidth = 1;
    context.stroke();

    setHasSignature(false);
    onChange(null);
  };

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        className="w-full touch-none rounded-lg border border-gray-300 bg-white"
        style={{ height: `${height}px` }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="mt-2 flex w-full justify-end">
        <button
          type="button"
          onClick={clearSignature}
          className="text-brand-500 hover:text-brand-600 text-sm transition-colors"
        >
          Clear signature
        </button>
      </div>
    </div>
  );
}
