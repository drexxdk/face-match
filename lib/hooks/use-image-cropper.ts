import { useState, useCallback, RefObject } from 'react';
import toast from 'react-hot-toast';

interface CropState {
  x: number;
  y: number;
  size: number;
}

interface ImageDimensions {
  width: number;
  height: number;
}

interface UseImageCropperOptions {
  maxFileSize?: number; // in bytes, default 1MB
  validTypes?: string[];
  quality?: number; // JPEG quality 0-1, default 0.85
}

export function useImageCropper(options: UseImageCropperOptions = {}) {
  const {
    maxFileSize = 1024 * 1024, // 1MB
    validTypes = ['image/jpeg', 'image/png'],
    quality = 0.85,
  } = options;

  const [showCropper, setShowCropper] = useState(false);
  const [originalImage, setOriginalImage] = useState<string>('');
  const [preview, setPreview] = useState<string>('');
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions>({ width: 0, height: 0 });
  const [draggingBox, setDraggingBox] = useState(false);
  const [resizingCorner, setResizingCorner] = useState<string | null>(null);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropSize, setCropSize] = useState(200);
  const [startCropState, setStartCropState] = useState<CropState & { mouseX: number; mouseY: number }>({
    x: 0,
    y: 0,
    size: 0,
    mouseX: 0,
    mouseY: 0,
  });

  const validateAndLoadImage = useCallback(
    (file: File): Promise<boolean> => {
      return new Promise((resolve) => {
        // Check file type
        if (!validTypes.includes(file.type)) {
          toast.error('Please select a JPEG or PNG image');
          resolve(false);
          return;
        }

        // Check file size
        if (file.size > maxFileSize) {
          const sizeMB = (maxFileSize / (1024 * 1024)).toFixed(0);
          toast.error(`File size must be less than ${sizeMB} MB`);
          resolve(false);
          return;
        }

        // Read image and show cropper
        const reader = new FileReader();
        reader.onloadend = () => {
          const imageData = reader.result as string;
          setOriginalImage(imageData);
          setShowCropper(true);

          // Create a temporary image to get dimensions
          const img = new window.Image();
          img.onload = () => {
            setImageDimensions({ width: img.width, height: img.height });
            const minDimension = Math.min(img.width, img.height);
            setCropX(Math.max(0, (img.width - minDimension) / 2));
            setCropY(Math.max(0, (img.height - minDimension) / 2));
            setCropSize(minDimension);
            resolve(true);
          };
          img.onerror = () => {
            toast.error('Failed to load image');
            resolve(false);
          };
          img.src = imageData;
        };
        reader.onerror = () => {
          toast.error('Failed to read file');
          resolve(false);
        };
        reader.readAsDataURL(file);
      });
    },
    [validTypes, maxFileSize],
  );

  const applyCrop = useCallback(async (): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = cropSize;
        canvas.height = cropSize;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, cropSize, cropSize);
          const croppedImage = canvas.toDataURL('image/jpeg', quality);
          setPreview(croppedImage);

          // Convert cropped canvas to File
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const file = new File([blob], 'cropped-image.jpg', {
                  type: 'image/jpeg',
                });
                setCroppedFile(file);
                setShowCropper(false);
                resolve(true);
              } else {
                toast.error('Failed to create cropped image');
                resolve(false);
              }
            },
            'image/jpeg',
            quality,
          );
        } else {
          toast.error('Failed to get canvas context');
          resolve(false);
        }
      };
      img.onerror = () => {
        toast.error('Failed to load image for cropping');
        resolve(false);
      };
      img.src = originalImage;
    });
  }, [cropSize, cropX, cropY, quality, originalImage]);

  const handleMouseDownBox = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDraggingBox(true);
      setStartCropState({ x: cropX, y: cropY, size: cropSize, mouseX: e.clientX, mouseY: e.clientY });
    },
    [cropX, cropY, cropSize],
  );

  const handleMouseDownCorner = useCallback(
    (corner: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setResizingCorner(corner);
      setStartCropState({ x: cropX, y: cropY, size: cropSize, mouseX: e.clientX, mouseY: e.clientY });
    },
    [cropX, cropY, cropSize],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent, containerRef: RefObject<HTMLDivElement>) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const scaleX = imageDimensions.width / rect.width;
      const scaleY = imageDimensions.height / rect.height;

      if (draggingBox) {
        const deltaX = (e.clientX - startCropState.mouseX) * scaleX;
        const deltaY = (e.clientY - startCropState.mouseY) * scaleY;
        const newX = Math.max(0, Math.min(imageDimensions.width - cropSize, startCropState.x + deltaX));
        const newY = Math.max(0, Math.min(imageDimensions.height - cropSize, startCropState.y + deltaY));
        setCropX(newX);
        setCropY(newY);
      } else if (resizingCorner) {
        const deltaX = e.clientX - startCropState.mouseX;
        const deltaY = e.clientY - startCropState.mouseY;

        let newSize = startCropState.size;
        let newX = startCropState.x;
        let newY = startCropState.y;

        let delta = 0;
        if (resizingCorner === 'tl') {
          delta = Math.max(-deltaX * scaleX, -deltaY * scaleY);
          newSize = Math.min(
            startCropState.size + delta,
            startCropState.x + startCropState.size,
            startCropState.y + startCropState.size,
          );
          newX = startCropState.x + startCropState.size - newSize;
          newY = startCropState.y + startCropState.size - newSize;
        } else if (resizingCorner === 'tr') {
          delta = Math.max(deltaX * scaleX, -deltaY * scaleY);
          newSize = Math.min(
            startCropState.size + delta,
            imageDimensions.width - startCropState.x,
            startCropState.y + startCropState.size,
          );
          newY = startCropState.y + startCropState.size - newSize;
        } else if (resizingCorner === 'bl') {
          delta = Math.max(-deltaX * scaleX, deltaY * scaleY);
          newSize = Math.min(
            startCropState.size + delta,
            startCropState.x + startCropState.size,
            imageDimensions.height - startCropState.y,
          );
          newX = startCropState.x + startCropState.size - newSize;
        } else if (resizingCorner === 'br') {
          delta = Math.max(deltaX * scaleX, deltaY * scaleY);
          newSize = Math.min(
            startCropState.size + delta,
            imageDimensions.width - startCropState.x,
            imageDimensions.height - startCropState.y,
          );
        }

        const minSize = 50;
        newSize = Math.max(minSize, newSize);

        setCropSize(newSize);
        setCropX(newX);
        setCropY(newY);
      }
    },
    [draggingBox, resizingCorner, startCropState, imageDimensions, cropSize],
  );

  const handleMouseUp = useCallback(() => {
    setDraggingBox(false);
    setResizingCorner(null);
  }, []);

  const cancelCrop = useCallback(() => {
    setShowCropper(false);
    setOriginalImage('');
    setCropX(0);
    setCropY(0);
    setCropSize(200);
  }, []);

  const reset = useCallback(() => {
    setPreview('');
    setCroppedFile(null);
    setShowCropper(false);
    setOriginalImage('');
    setCropX(0);
    setCropY(0);
    setCropSize(200);
    setDraggingBox(false);
    setResizingCorner(null);
  }, []);

  return {
    // State
    showCropper,
    originalImage,
    preview,
    croppedFile,
    imageDimensions,
    draggingBox,
    resizingCorner,
    cropX,
    cropY,
    cropSize,

    // Actions
    validateAndLoadImage,
    applyCrop,
    cancelCrop,
    reset,

    // Mouse handlers
    handleMouseDownBox,
    handleMouseDownCorner,
    handleMouseMove,
    handleMouseUp,

    // Direct setters (for manual control if needed)
    setPreview,
    setCroppedFile,
    setShowCropper,
  };
}
