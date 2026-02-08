'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import type { PersonInsert, GenderType } from '@/lib/schemas';
import { logError, getErrorMessage } from '@/lib/logger';
import { sanitizeName, validateLength } from '@/lib/security';

export function AddPersonForm({ groupId }: { groupId: string }) {
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [originalImage, setOriginalImage] = useState<string>('');
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [draggingBox, setDraggingBox] = useState(false);
  const [resizingCorner, setResizingCorner] = useState<string | null>(null);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropSize, setCropSize] = useState(200);
  const [startCropState, setStartCropState] = useState({
    x: 0,
    y: 0,
    size: 0,
    mouseX: 0,
    mouseY: 0,
  });
  const [formData, setFormData] = useState<{
    first_name: string;
    last_name: string;
    gender: GenderType;
  }>({
    first_name: '',
    last_name: '',
    gender: 'other',
  });

  const handleImageSelect = (file: File) => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a JPEG or PNG image');
      return;
    }

    // Check file size (max 1 MB)
    const maxSize = 1024 * 1024; // 1 MB in bytes
    if (file.size > maxSize) {
      toast.error('File size must be less than 1 MB');
      return;
    }

    // Set loading state while processing image
    setImageLoading(true);

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
        // Use the full dimension (largest square that fits)
        setCropX(Math.max(0, (img.width - minDimension) / 2));
        setCropY(Math.max(0, (img.height - minDimension) / 2));
        setCropSize(minDimension);
        setImageLoading(false);
      };
      img.src = imageData;
    };
    reader.readAsDataURL(file);
  };

  const applyCrop = async () => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = cropSize;
      canvas.height = cropSize;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, cropSize, cropSize);
        const croppedImage = canvas.toDataURL('image/jpeg', 0.85);
        setPreview(croppedImage);

        // Convert cropped canvas to File - use JPEG with compression to keep file size down
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const croppedFile = new File([blob], 'cropped-image.jpg', {
                type: 'image/jpeg',
              });
              setSelectedFile(croppedFile);
              setShowCropper(false);
            }
          },
          'image/jpeg',
          0.85,
        );
      }
    };
    img.src = originalImage;
  };

  const cancelCrop = () => {
    setShowCropper(false);
    setOriginalImage('');
    setPreview('');
    setImageLoading(false);
  };

  const handleCropBoxMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!cropContainerRef.current) return;

    const rect = cropContainerRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;

    setDraggingBox(true);
    setStartCropState({
      x: cropX,
      y: cropY,
      size: cropSize,
      mouseX: relativeX,
      mouseY: relativeY,
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, corner: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!cropContainerRef.current) return;

    const rect = cropContainerRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;

    setResizingCorner(corner);
    setStartCropState({
      x: cropX,
      y: cropY,
      size: cropSize,
      mouseX: relativeX,
      mouseY: relativeY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cropContainerRef.current) return;

    const rect = cropContainerRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;

    if (draggingBox) {
      const deltaX = relativeX - startCropState.mouseX;
      const deltaY = relativeY - startCropState.mouseY;

      // Scale delta based on container size vs image dimensions
      const scaleX = imageDimensions.width / rect.width;
      const scaleY = imageDimensions.height / rect.height;

      const newX = Math.max(0, Math.min(startCropState.x + deltaX * scaleX, imageDimensions.width - cropSize));
      const newY = Math.max(0, Math.min(startCropState.y + deltaY * scaleY, imageDimensions.height - cropSize));

      setCropX(newX);
      setCropY(newY);
    } else if (resizingCorner) {
      const deltaX = relativeX - startCropState.mouseX;
      const deltaY = relativeY - startCropState.mouseY;

      // Scale delta based on container size vs image dimensions
      const scaleX = imageDimensions.width / rect.width;
      const scaleY = imageDimensions.height / rect.height;

      let newSize = startCropState.size;
      let newX = startCropState.x;
      let newY = startCropState.y;

      // Use the appropriate delta based on corner
      let delta = 0;
      if (resizingCorner === 'tl') {
        delta = Math.max(-deltaX * scaleX, -deltaY * scaleY);
      } else if (resizingCorner === 'tr') {
        delta = Math.max(deltaX * scaleX, -deltaY * scaleY);
      } else if (resizingCorner === 'bl') {
        delta = Math.max(-deltaX * scaleX, deltaY * scaleY);
      } else if (resizingCorner === 'br') {
        delta = Math.max(deltaX * scaleX, deltaY * scaleY);
      }

      newSize = Math.max(
        50,
        Math.min(startCropState.size + delta, Math.min(imageDimensions.width, imageDimensions.height)),
      );
      const sizeDiff = newSize - startCropState.size;

      // Adjust position based on corner to keep the opposite corner fixed
      if (resizingCorner === 'tl') {
        newX = Math.max(0, Math.min(startCropState.x - sizeDiff, imageDimensions.width - newSize));
        newY = Math.max(0, Math.min(startCropState.y - sizeDiff, imageDimensions.height - newSize));
      } else if (resizingCorner === 'tr') {
        newX = startCropState.x;
        newY = Math.max(0, Math.min(startCropState.y - sizeDiff, imageDimensions.height - newSize));
      } else if (resizingCorner === 'bl') {
        newX = Math.max(0, Math.min(startCropState.x - sizeDiff, imageDimensions.width - newSize));
        newY = startCropState.y;
      } else if (resizingCorner === 'br') {
        newX = startCropState.x;
        newY = startCropState.y;
      }

      // Keep in bounds
      newX = Math.max(0, Math.min(newX, imageDimensions.width - newSize));
      newY = Math.max(0, Math.min(newY, imageDimensions.height - newSize));

      setCropX(newX);
      setCropY(newY);
      setCropSize(newSize);
    }
  };

  const handleMouseUp = () => {
    setDraggingBox(false);
    setResizingCorner(null);
  };

  const handleReset = () => {
    setFormData({
      first_name: '',
      last_name: '',
      gender: 'other',
    });
    setPreview('');
    setSelectedFile(null);
    setOriginalImage('');
    setShowCropper(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Sanitize and validate inputs
    const firstName = sanitizeName(formData.first_name);
    const lastName = sanitizeName(formData.last_name);

    if (!firstName || !lastName) {
      toast.error('Please enter first and last name');
      return;
    }

    if (!validateLength(firstName, 50, 1) || !validateLength(lastName, 50, 1)) {
      toast.error('Names must be between 1 and 50 characters');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      let imageUrl = '';

      // Upload image if one was selected
      if (selectedFile) {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const filename = `${timestamp}-${randomString}-${selectedFile.name}`;

        const { error: uploadError } = await supabase.storage.from('person-images').upload(filename, selectedFile);

        if (uploadError) {
          if (uploadError.message.includes('Bucket not found')) {
            throw new Error(
              "The 'person-images' storage bucket does not exist. Please create it in your Supabase dashboard: Storage → Create new bucket → Name it 'person-images' → Enable Public bucket → Create.",
            );
          }
          throw uploadError;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage.from('person-images').getPublicUrl(filename);

        imageUrl = publicUrlData.publicUrl;
      }

      // Build the person object with sanitized values
      const personData: PersonInsert = {
        group_id: groupId,
        first_name: firstName,
        last_name: lastName,
        gender: formData.gender,
      };

      // Only include image_url if it has a value
      if (imageUrl) {
        personData.image_url = imageUrl;
      }

      const { error } = await supabase.from('people').insert(personData);

      if (error) {
        if (error.message.includes('row-level security')) {
          throw new Error(
            'Permission denied: RLS policy prevents adding people. In Supabase: Database → Tables → people → RLS toggle OFF (or create INSERT policy).',
          );
        }
        throw error;
      }

      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        gender: 'other',
      });
      setPreview('');
      setSelectedFile(null);
      setOriginalImage('');
      setShowCropper(false);

      toast.success(`${formData.first_name} ${formData.last_name} added!`);
      // Let real-time subscription handle the update
    } catch (err: unknown) {
      logError(err);
      toast.error('Error adding person: ' + getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="relative flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="first_name">
              First Name{' '}
              <span className="text-destructive" aria-label="required">
                *
              </span>
            </Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              autoComplete="one-time-code"
              data-1p-ignore
              data-lpignore="true"
              required
              aria-required="true"
              disabled={loading}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="last_name">
              Last Name{' '}
              <span className="text-destructive" aria-label="required">
                *
              </span>
            </Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              autoComplete="one-time-code"
              data-1p-ignore
              data-lpignore="true"
              required
              aria-required="true"
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="gender">
            Gender{' '}
            <span className="text-destructive" aria-label="required">
              *
            </span>
          </Label>
          <select
            id="gender"
            value={formData.gender}
            onChange={(e) =>
              setFormData({
                ...formData,
                gender: e.target.value as 'male' | 'female' | 'other',
              })
            }
            className="border-input bg-background focus-visible:ring-ring focus-visible:ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            required
            aria-required="true"
            disabled={loading}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Photo</Label>

          {showCropper ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-600">Drag to move • Drag corners to resize</p>
              <div
                ref={cropContainerRef}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: imageDimensions.width / imageDimensions.height || '1',
                  overflow: 'hidden',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '8px',
                  cursor: resizingCorner ? 'pointer' : draggingBox ? 'grabbing' : 'grab',
                }}
              >
                <Image
                  src={originalImage}
                  alt="Crop"
                  fill
                  style={{
                    objectFit: 'contain',
                  }}
                />

                {/* Darkened overlay areas */}
                {/* Top */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: `${(cropY / imageDimensions.height) * 100}%`,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    pointerEvents: 'none',
                  }}
                />
                {/* Bottom */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: `${((imageDimensions.height - cropY - cropSize) / imageDimensions.height) * 100}%`,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    pointerEvents: 'none',
                  }}
                />
                {/* Left */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: `${(cropY / imageDimensions.height) * 100}%`,
                    bottom: `${((imageDimensions.height - cropY - cropSize) / imageDimensions.height) * 100}%`,
                    width: `${(cropX / imageDimensions.width) * 100}%`,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    pointerEvents: 'none',
                  }}
                />
                {/* Right */}
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: `${(cropY / imageDimensions.height) * 100}%`,
                    bottom: `${((imageDimensions.height - cropY - cropSize) / imageDimensions.height) * 100}%`,
                    width: `${((imageDimensions.width - cropX - cropSize) / imageDimensions.width) * 100}%`,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Crop box with border and handles */}
                <div
                  onMouseDown={handleCropBoxMouseDown}
                  style={{
                    position: 'absolute',
                    left: `${(cropX / imageDimensions.width) * 100}%`,
                    top: `${(cropY / imageDimensions.height) * 100}%`,
                    width: `${(cropSize / imageDimensions.width) * 100}%`,
                    height: `${(cropSize / imageDimensions.height) * 100}%`,
                    border: '2px solid white',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Corner resize handles */}
                  {['tl', 'tr', 'bl', 'br'].map((corner) => (
                    <div
                      key={corner}
                      onMouseDown={(e) => handleResizeMouseDown(e, corner)}
                      style={{
                        position: 'absolute',
                        width: '14px',
                        height: '14px',
                        backgroundColor: 'white',
                        border: '2px solid #333',
                        borderRadius: '50%',
                        cursor: corner === 'tl' || corner === 'br' ? 'nwse-resize' : 'nesw-resize',
                        ...(corner === 'tl' && {
                          top: '-7px',
                          left: '-7px',
                        }),
                        ...(corner === 'tr' && {
                          top: '-7px',
                          right: '-7px',
                        }),
                        ...(corner === 'bl' && {
                          bottom: '-7px',
                          left: '-7px',
                        }),
                        ...(corner === 'br' && {
                          bottom: '-7px',
                          right: '-7px',
                        }),
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <Button type="button" onClick={cancelCrop} variant="outline" className="flex-1">
                  ✕ Change Image
                </Button>
                <Button type="button" onClick={applyCrop} className="flex-1">
                  ✓ Use This Crop
                </Button>
              </div>
            </div>
          ) : (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileInputChange}
                disabled={loading}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              {imageLoading ? (
                <div className="pointer-events-none flex flex-col gap-3 py-8">
                  <div className="border-t-primary border-r-primary mx-auto h-12 w-12 animate-spin rounded-full border-4 border-transparent"></div>
                  <p className="text-sm font-medium">Processing image...</p>
                </div>
              ) : preview ? (
                <div className="pointer-events-none flex flex-col gap-3">
                  <div className="relative mx-auto">
                    <Image src={preview} alt="Preview" width={500} height={500} className="rounded-lg object-cover" />
                  </div>
                  <p className="text-sm font-medium">Image ready</p>
                  <p className="text-muted-foreground text-xs">Click or drag to replace</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 py-8">
                  <p className="text-sm font-medium">Drag and drop an image here</p>
                  <p className="text-muted-foreground text-xs">or click to select from your device</p>
                </div>
              )}
            </div>
          )}
        </div>

        {!showCropper && (
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleReset} disabled={loading} className="flex-1">
              Reset
            </Button>
            <Button
              type="submit"
              disabled={!formData.first_name.trim() || !formData.last_name.trim() || !selectedFile}
              loading={loading}
              loadingText="Adding..."
              className="flex-1"
            >
              Add Person
            </Button>
          </div>
        )}
      </form>
    </>
  );
}
