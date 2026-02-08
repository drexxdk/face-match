'use client';

import { useState, useRef, useEffect } from 'react';
import { FaDownload } from 'react-icons/fa6';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import Image from 'next/image';
import type { GenderType } from '@/lib/schemas';
import { logError, getErrorMessage } from '@/lib/logger';
import { sanitizeName, validateLength } from '@/lib/security';

interface CSVRow {
  first_name: string;
  last_name: string;
  gender: GenderType;
  image_url?: string;
}

interface ProcessedPerson extends CSVRow {
  status: 'skipped' | 'accepted';
  croppedImage?: File;
}

export function BulkUploadPeople({ groupId, onComplete }: { groupId: string; onComplete?: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processedPeople, setProcessedPeople] = useState<ProcessedPerson[]>([]);

  // Cropping state
  const [showCropper, setShowCropper] = useState(false);
  const [originalImage, setOriginalImage] = useState<string>('');
  const [preview, setPreview] = useState<string>('');
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
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

  // Current person being edited
  const [editingPerson, setEditingPerson] = useState<CSVRow | null>(null);

  // Use a ref to track the latest editingPerson value to avoid stale closures
  const editingPersonRef = useRef<CSVRow | null>(null);

  // Keep the ref in sync with editingPerson state
  useEffect(() => {
    editingPersonRef.current = editingPerson;
  }, [editingPerson]);

  const [loadingImage, setLoadingImage] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const firstNameIndex = headers.indexOf('first_name');
    const lastNameIndex = headers.indexOf('last_name');
    const genderIndex = headers.indexOf('gender');
    const imageUrlIndex = headers.indexOf('image_url');

    if (firstNameIndex === -1 || lastNameIndex === -1) {
      toast.error('CSV must have first_name and last_name columns');
      return [];
    }

    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const firstName = values[firstNameIndex] || '';
      const lastName = values[lastNameIndex] || '';
      const gender = (values[genderIndex] || 'other') as GenderType;
      const imageUrl = imageUrlIndex !== -1 ? values[imageUrlIndex] : undefined;

      if (firstName && lastName) {
        rows.push({
          first_name: firstName,
          last_name: lastName,
          gender: ['male', 'female', 'other'].includes(gender) ? gender : 'other',
          image_url: imageUrl && imageUrl.trim() ? imageUrl.trim() : undefined,
        });
      }
    }

    return rows;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length > 0) {
        setParsedData(parsed);
        setCurrentIndex(0);
        const firstPerson = { ...parsed[0] };
        setEditingPerson(firstPerson);
        editingPersonRef.current = firstPerson;
        setProcessedPeople([]);
        setPreview('');
        setCroppedFile(null);
        setOriginalImage('');
        setImageLoadFailed(false);
        setDragActive(false);
        // Start loading image if URL provided
        if (parsed[0].image_url) {
          loadImageFromUrl(parsed[0].image_url);
        }
      }
    };
    reader.readAsText(file);
  };

  const loadImageFromUrl = async (url: string) => {
    if (!url || !url.startsWith('http')) {
      setImageLoadFailed(true);
      return;
    }

    setLoadingImage(true);
    setImageLoadFailed(false);

    // Use Image element to load - this bypasses CORS issues for display
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // Convert to canvas to get data URL
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        ctx.drawImage(img, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.95);

        setOriginalImage(imageData);
        setImageLoadFailed(false);
        setImageDimensions({ width: img.width, height: img.height });

        const minDimension = Math.min(img.width, img.height);
        setCropX(Math.max(0, (img.width - minDimension) / 2));
        setCropY(Math.max(0, (img.height - minDimension) / 2));
        setCropSize(minDimension);
        setShowCropper(true);
        setLoadingImage(false);
      } catch (error) {
        setImageLoadFailed(true);
        setLoadingImage(false);
        logError('Failed to process image', error);
      }
    };

    img.onerror = () => {
      setImageLoadFailed(true);
      setLoadingImage(false);
    };

    img.src = url;
  };

  const handleManualImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setLoadingImage(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageData = reader.result as string;
      setOriginalImage(imageData);
      setImageLoadFailed(false);

      const img = new window.Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
        const minDimension = Math.min(img.width, img.height);
        setCropX(Math.max(0, (img.width - minDimension) / 2));
        setCropY(Math.max(0, (img.height - minDimension) / 2));
        setCropSize(minDimension);
        setShowCropper(true);
        setLoadingImage(false);
      };
      img.src = imageData;
    };
    reader.readAsDataURL(file);
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
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      setLoadingImage(true);

      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setOriginalImage(imageData);
        setImageLoadFailed(false);

        const img = new window.Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
          const minDimension = Math.min(img.width, img.height);
          setCropX(Math.max(0, (img.width - minDimension) / 2));
          setCropY(Math.max(0, (img.height - minDimension) / 2));
          setCropSize(minDimension);
          setShowCropper(true);
          setLoadingImage(false);
        };
        img.src = imageData;
      };
      reader.readAsDataURL(file);
    }
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

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
              setCroppedFile(file);
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
    setImageLoadFailed(false);
    setDragActive(false);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
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
      const scaleX = imageDimensions.width / rect.width;
      const scaleY = imageDimensions.height / rect.height;

      const newX = Math.max(0, Math.min(startCropState.x + deltaX * scaleX, imageDimensions.width - cropSize));
      const newY = Math.max(0, Math.min(startCropState.y + deltaY * scaleY, imageDimensions.height - cropSize));

      setCropX(newX);
      setCropY(newY);
    } else if (resizingCorner) {
      const deltaX = relativeX - startCropState.mouseX;
      const deltaY = relativeY - startCropState.mouseY;
      const scaleX = imageDimensions.width / rect.width;
      const scaleY = imageDimensions.height / rect.height;

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
  };

  const handleMouseUp = () => {
    setDraggingBox(false);
    setResizingCorner(null);
  };

  const handleSkip = () => {
    if (!editingPerson) return;

    const personToSkip = { ...editingPerson, status: 'skipped' as const };

    const nextIndex = currentIndex + 1;
    if (nextIndex < parsedData.length) {
      setProcessedPeople((prev) => [...prev, personToSkip]);
      setCurrentIndex(nextIndex);
      const nextPerson = { ...parsedData[nextIndex] };
      setEditingPerson(nextPerson);
      editingPersonRef.current = nextPerson;
      setPreview('');
      setCroppedFile(null);
      setShowCropper(false);
      setImageLoadFailed(false);
      setOriginalImage('');
      setDragActive(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
      if (parsedData[nextIndex].image_url) {
        loadImageFromUrl(parsedData[nextIndex].image_url);
      }
    } else {
      // Done with all people - pass complete list including current skip
      const completeProcessedList = [...processedPeople, personToSkip];
      finalizeBulkUpload(completeProcessedList);
    }
  };

  const handleAccept = () => {
    // Read from ref to get the absolute latest value, avoiding stale closures
    const currentPerson = editingPersonRef.current;
    if (!currentPerson) return;

    const currentCroppedFile = croppedFile;

    // Validate required data
    if (!currentPerson.first_name || !currentPerson.last_name) {
      toast.error('First name and last name are required');
      return;
    }

    if (!preview) {
      toast.error('Photo is required - please upload and crop an image');
      return;
    }

    const personToAdd = {
      ...currentPerson,
      status: 'accepted' as const,
      croppedImage: currentCroppedFile || undefined,
    };

    const nextIndex = currentIndex + 1;
    if (nextIndex < parsedData.length) {
      // Add to processed list and move to next person
      setProcessedPeople((prev) => [...prev, personToAdd]);
      setCurrentIndex(nextIndex);
      const nextPerson = { ...parsedData[nextIndex] };
      setEditingPerson(nextPerson);
      editingPersonRef.current = nextPerson;
      setPreview('');
      setCroppedFile(null);
      setShowCropper(false);
      setImageLoadFailed(false);
      setOriginalImage('');
      setDragActive(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
      if (parsedData[nextIndex].image_url) {
        loadImageFromUrl(parsedData[nextIndex].image_url);
      }
    } else {
      // Done with all people - pass complete list including current person
      const completeProcessedList = [...processedPeople, personToAdd];
      finalizeBulkUpload(completeProcessedList);
    }
  };

  const finalizeBulkUpload = async (peopleToUpload?: ProcessedPerson[]) => {
    const acceptedPeople = peopleToUpload
      ? peopleToUpload.filter((p) => p.status === 'accepted')
      : processedPeople.filter((p) => p.status === 'accepted');

    if (acceptedPeople.length === 0) {
      toast('No people were accepted');
      resetForm();
      return;
    }

    setUploading(true);
    const supabase = createClient();
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const person of acceptedPeople) {
        try {
          const sanitizedFirstName = sanitizeName(person.first_name);
          const sanitizedLastName = sanitizeName(person.last_name);

          if (!sanitizedFirstName || !sanitizedLastName) {
            throw new Error('Invalid name format');
          }

          if (!validateLength(sanitizedFirstName, 50, 1) || !validateLength(sanitizedLastName, 50, 1)) {
            throw new Error('Names must be between 1-50 characters');
          }

          let imageUrl: string | undefined;

          if (person.croppedImage) {
            const fileName = `${Date.now()}-${sanitizedFirstName}-${sanitizedLastName}.jpg`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('person-images')
              .upload(fileName, person.croppedImage, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: false,
              });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('person-images').getPublicUrl(uploadData.path);
            imageUrl = urlData.publicUrl;
          }

          const { error: insertError } = await supabase.from('people').insert({
            group_id: groupId,
            first_name: sanitizedFirstName,
            last_name: sanitizedLastName,
            gender: person.gender,
            image_url: imageUrl,
          });

          if (insertError) throw insertError;

          successCount++;
        } catch (err) {
          errorCount++;
          logError(`Failed to upload person ${person.first_name} ${person.last_name}`, err);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} ${successCount === 1 ? 'person' : 'people'}`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} ${errorCount === 1 ? 'person' : 'people'}`);
      }

      resetForm();
      onComplete?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
      logError('Bulk upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setParsedData([]);
    setCurrentIndex(0);
    setProcessedPeople([]);
    setEditingPerson(null);
    editingPersonRef.current = null;
    setPreview('');
    setCroppedFile(null);
    setShowCropper(false);
    setOriginalImage('');
    setImageLoadFailed(false);
    setDragActive(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const template =
      'first_name,last_name,gender,image_url\nJohn,Doe,male,https://picsum.photos/256\nJane,Smith,female,';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'people_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const isFormValid = editingPerson && editingPerson.first_name.trim() && editingPerson.last_name.trim() && preview; // Photo is required - must have uploaded/cropped an image

  // Show person editor
  if (editingPerson) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Review Person</h3>
          <div className="text-muted-foreground text-sm">
            {currentIndex + 1} of {parsedData.length} • {processedPeople.filter((p) => p.status === 'accepted').length}{' '}
            accepted
          </div>
        </div>

        <div className="bg-muted/30 flex flex-col gap-4 rounded-lg border p-4">
          <div>
            <Label htmlFor="first-name">First Name</Label>
            <Input
              id="first-name"
              value={editingPerson.first_name}
              onChange={(e) => {
                const value = e.target.value;
                setEditingPerson((prev) => {
                  const next = prev ? { ...prev, first_name: value } : null;
                  editingPersonRef.current = next; // Update ref synchronously
                  return next;
                });
              }}
              className="mt-1"
              disabled={uploading}
            />
          </div>

          <div>
            <Label htmlFor="last-name">Last Name</Label>
            <Input
              id="last-name"
              value={editingPerson.last_name}
              onChange={(e) => {
                const value = e.target.value;
                setEditingPerson((prev) => {
                  const next = prev ? { ...prev, last_name: value } : null;
                  editingPersonRef.current = next; // Update ref synchronously
                  return next;
                });
              }}
              className="mt-1"
              disabled={uploading}
            />
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              value={editingPerson.gender}
              onChange={(e) => {
                const value = e.target.value as GenderType;
                setEditingPerson((prev) => {
                  const next = prev ? { ...prev, gender: value } : null;
                  editingPersonRef.current = next; // Update ref synchronously
                  return next;
                });
              }}
              className="border-input bg-background mt-1 w-full rounded-md border px-3 py-2 text-sm"
              disabled={uploading}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <Label>Photo</Label>
            {loadingImage ? (
              <div className="bg-muted mt-1 flex h-40 flex-col items-center justify-center gap-3 rounded-lg border">
                <div className="border-t-primary border-r-primary h-8 w-8 animate-spin rounded-full border-2 border-transparent"></div>
                <div className="text-muted-foreground text-sm">Loading image...</div>
              </div>
            ) : showCropper && originalImage ? (
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
                    aspectRatio: `${imageDimensions.width}/${imageDimensions.height}` || '1',
                    overflow: 'hidden',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '8px',
                    cursor: resizingCorner ? 'pointer' : draggingBox ? 'grabbing' : 'grab',
                  }}
                >
                  <Image
                    src={originalImage}
                    alt="Crop preview"
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
            ) : preview ? (
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
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleManualImageSelect}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <div className="pointer-events-none space-y-3">
                  <div className="relative mx-auto">
                    <Image src={preview} alt="Preview" width={500} height={500} className="rounded-lg object-cover" />
                  </div>
                  <p className="text-sm font-medium">Image ready</p>
                  <p className="text-muted-foreground text-xs">Click or drag to replace</p>
                </div>
              </div>
            ) : originalImage ? (
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
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleManualImageSelect}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <div className="pointer-events-none space-y-3">
                  <div className="relative mx-auto">
                    <Image
                      src={originalImage}
                      alt="Loaded image"
                      width={500}
                      height={500}
                      className="rounded-lg object-cover"
                    />
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowCropper(true)}
                    className="pointer-events-auto"
                  >
                    Crop Image
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
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleManualImageSelect}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                {imageLoadFailed && (
                  <div className="pointer-events-none mb-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-2">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      Could not load image from URL. Please upload manually.
                    </p>
                  </div>
                )}
                <div className="pointer-events-none flex flex-col gap-2 py-8">
                  <p className="text-sm font-medium">Drag and drop an image here</p>
                  <p className="text-muted-foreground text-xs">or click to select from your device</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {!showCropper && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSkip} className="flex-1" disabled={uploading}>
              Skip
            </Button>
            <Button onClick={handleAccept} className="flex-1" disabled={!isFormValid || uploading}>
              Accept
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Initial upload form
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label htmlFor="csv-upload">Upload CSV File</Label>
        <p className="text-muted-foreground text-sm">
          Import multiple people at once. You&apos;ll review and crop each person&apos;s photo individually.
        </p>
        <input
          ref={fileInputRef}
          id="csv-upload"
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileSelect}
          className="border-input bg-background file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 w-full cursor-pointer rounded-md border text-sm file:mr-4 file:cursor-pointer file:rounded-l-md file:border-0 file:px-4 file:py-2 file:font-medium"
        />
      </div>

      <Button variant="outline" onClick={downloadTemplate} className="flex w-full items-center gap-2">
        <Icon icon={FaDownload} size="sm" />
        Download CSV Template
      </Button>
    </div>
  );
}
