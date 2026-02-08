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

  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
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
      const values = parseCSVLine(lines[i]);
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
    if (!url) {
      setImageLoadFailed(true);
      return;
    }

    // Handle data URLs (base64 encoded images)
    if (url.startsWith('data:image/')) {
      setLoadingImage(true);
      setImageLoadFailed(false);

      const img = new window.Image();
      img.onload = () => {
        setOriginalImage(url);
        setImageLoadFailed(false);
        setImageDimensions({ width: img.width, height: img.height });

        const minDimension = Math.min(img.width, img.height);
        setCropX(Math.max(0, (img.width - minDimension) / 2));
        setCropY(Math.max(0, (img.height - minDimension) / 2));
        setCropSize(minDimension);
        setShowCropper(true);
        setLoadingImage(false);
      };

      img.onerror = () => {
        setImageLoadFailed(true);
        setLoadingImage(false);
        logError('Failed to load data URL image');
        toast.error('Invalid image data. Please upload manually.');
      };

      img.src = url;
      return;
    }

    // Handle HTTP/HTTPS URLs
    if (!url.startsWith('http')) {
      setImageLoadFailed(true);
      return;
    }

    setLoadingImage(true);
    setImageLoadFailed(false);

    // Try loading with crossOrigin first for CORS-friendly sources
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
        // Canvas operations failed, likely CORS issue
        // Try loading without crossOrigin for display only
        const imgNoCors = new window.Image();

        imgNoCors.onload = () => {
          setImageLoadFailed(true);
          setLoadingImage(false);
          logError('Image loaded but CORS policy prevents cropping', error);
          toast.error(
            'This image URL does not support cropping due to CORS restrictions. Please download and upload the image manually.',
          );
        };

        imgNoCors.onerror = () => {
          setImageLoadFailed(true);
          setLoadingImage(false);
          logError('Failed to load image', error);
          toast.error('Failed to load image. Please upload manually.');
        };

        imgNoCors.src = url;
      }
    };

    img.onerror = (error) => {
      setImageLoadFailed(true);
      setLoadingImage(false);
      logError('Failed to load image from URL (CORS or network error)', error);
      toast.error(
        'Cannot load image from this URL. The server may not allow cross-origin requests. Please download the image and upload it manually.',
      );
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

  const handleAccept = async () => {
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

    // Check if person with same name already exists in this group
    const supabase = createClient();
    const sanitizedFirstName = sanitizeName(currentPerson.first_name);
    const sanitizedLastName = sanitizeName(currentPerson.last_name);

    const { data: existingPeople } = await supabase
      .from('people')
      .select('*, group_people!inner(group_id)')
      .eq('group_people.group_id', groupId)
      .ilike('first_name', sanitizedFirstName)
      .ilike('last_name', sanitizedLastName);

    if (existingPeople && existingPeople.length > 0) {
      toast.error(`${currentPerson.first_name} ${currentPerson.last_name} is already in this group`);
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

          // Check if person with same name already exists in this group
          const { data: existingPeople } = await supabase
            .from('people')
            .select('*, group_people!inner(group_id)')
            .eq('group_people.group_id', groupId)
            .ilike('first_name', sanitizedFirstName)
            .ilike('last_name', sanitizedLastName);

          if (existingPeople && existingPeople.length > 0) {
            throw new Error(`${sanitizedFirstName} ${sanitizedLastName} is already in this group`);
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

          const { data: newPerson, error: insertError } = await supabase
            .from('people')
            .insert({
              first_name: sanitizedFirstName,
              last_name: sanitizedLastName,
              gender: person.gender,
              image_url: imageUrl,
            })
            .select()
            .single();

          if (insertError) throw insertError;

          // Link the person to the group via junction table
          const { error: linkError } = await supabase.from('group_people').insert({
            group_id: groupId,
            person_id: newPerson.id,
          });

          if (linkError) {
            // If linking fails, delete the person we just created
            await supabase.from('people').delete().eq('id', newPerson.id);
            throw linkError;
          }

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
      'first_name,last_name,gender,image_url\nJohn,Doe,male,"data:image/jpeg;base64,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"\nJane,Smith,female,';
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
          <div suppressHydrationWarning>
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

          <div suppressHydrationWarning>
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

          <div suppressHydrationWarning>
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

          <div suppressHydrationWarning>
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
                    <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">Image Load Failed</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-500">
                      The image URL may be blocked by CORS policy or unavailable. Please upload the image manually from
                      your device instead.
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
