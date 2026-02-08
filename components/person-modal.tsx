'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Listbox } from '@/components/ui/listbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import type { PersonInsert, GenderType, Person } from '@/lib/schemas';
import { logError, getErrorMessage } from '@/lib/logger';
import { sanitizeName, validateLength } from '@/lib/security';
import { deletePersonImage } from '@/lib/game-utils';
import { useNameValidation } from '@/lib/hooks/use-name-validation';
import { validateImageFile } from '@/lib/image-validation';

interface PersonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  people: Person[];
  editPerson?: Person | null;
}

export function PersonModal({ open, onOpenChange, groupId, people, editPerson }: PersonModalProps) {
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
    name: string;
    gender: GenderType;
  }>({
    name: '',
    gender: 'other',
  });

  const isEditMode = !!editPerson;

  // Use name validation hook
  const { duplicateError } = useNameValidation({
    people,
    currentName: formData.name,
    excludePersonId: isEditMode ? editPerson?.id : undefined,
  });

  // Initialize form with edit data when modal opens in edit mode
  useEffect(() => {
    if (open && editPerson) {
      setFormData({
        name: editPerson.name,
        gender: editPerson.gender,
      });
      setPreview(editPerson.image_url || '');
    } else if (open && !editPerson) {
      // Reset form for add mode
      setFormData({
        name: '',
        gender: 'other',
      });
      setPreview('');
      setSelectedFile(null);
      setShowCropper(false);
      setOriginalImage('');
    }
  }, [open, editPerson]);

  const handleImageSelect = (file: File) => {
    // Validate image file type and size
    if (!validateImageFile(file)) {
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
    if (!isEditMode) {
      setPreview('');
    }
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
    const deltaX = relativeX - startCropState.mouseX;
    const deltaY = relativeY - startCropState.mouseY;

    if (draggingBox) {
      const newX = Math.max(0, Math.min(imageDimensions.width - cropSize, startCropState.x + deltaX));
      const newY = Math.max(0, Math.min(imageDimensions.height - cropSize, startCropState.y + deltaY));
      setCropX(newX);
      setCropY(newY);
    } else if (resizingCorner) {
      let delta = 0;
      switch (resizingCorner) {
        case 'top-left':
          delta = Math.min(deltaX, deltaY);
          break;
        case 'top-right':
          delta = Math.min(-deltaX, deltaY);
          break;
        case 'bottom-left':
          delta = Math.min(deltaX, -deltaY);
          break;
        case 'bottom-right':
          delta = Math.max(deltaX, deltaY);
          break;
      }

      let newSize = startCropState.size + delta;
      const minSize = 50;
      newSize = Math.max(minSize, newSize);

      let newX = startCropState.x;
      let newY = startCropState.y;

      if (resizingCorner.includes('top')) {
        newY = startCropState.y - (newSize - startCropState.size);
      }
      if (resizingCorner.includes('left')) {
        newX = startCropState.x - (newSize - startCropState.size);
      }

      newX = Math.max(0, Math.min(imageDimensions.width - newSize, newX));
      newY = Math.max(0, Math.min(imageDimensions.height - newSize, newY));

      if (newX + newSize > imageDimensions.width) {
        newSize = imageDimensions.width - newX;
      }
      if (newY + newSize > imageDimensions.height) {
        newSize = imageDimensions.height - newY;
      }

      setCropX(newX);
      setCropY(newY);
      setCropSize(newSize);
    }
  };

  const handleMouseUp = () => {
    setDraggingBox(false);
    setResizingCorner(null);
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
    const name = sanitizeName(formData.name);

    if (!name) {
      toast.error('Please enter a name');
      return;
    }

    if (!validateLength(name, 100, 1)) {
      toast.error('Name must be between 1 and 100 characters');
      return;
    }

    // Check for duplicate (should already be caught by real-time validation)
    if (duplicateError) {
      toast.error(duplicateError);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      let imageUrl = preview;

      // Upload new image if one was selected
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

        // Delete old image if we're editing and there was a previous image
        if (isEditMode && editPerson.image_url) {
          await deletePersonImage(supabase, editPerson.image_url);
        }
      }

      if (isEditMode) {
        // Update existing person
        const updateData: Partial<Person> = {
          name: name,
          gender: formData.gender,
        };

        // Only update image_url if a new image was uploaded
        if (selectedFile && imageUrl) {
          updateData.image_url = imageUrl;
        }

        const { error: updateError } = await supabase.from('people').update(updateData).eq('id', editPerson.id);

        if (updateError) {
          throw updateError;
        }

        toast.success(`${name} updated!`);
      } else {
        // Create new person
        const personData: PersonInsert = {
          name: name,
          gender: formData.gender,
        };

        // Only include image_url if it has a value
        if (imageUrl) {
          personData.image_url = imageUrl;
        }

        // Insert the person and get their ID back
        const { data: newPerson, error: personError } = await supabase
          .from('people')
          .insert(personData)
          .select()
          .single();

        if (personError) {
          throw new Error(`Failed to insert person: ${personError.message || JSON.stringify(personError)}`);
        }

        // Link the person to the group via junction table
        const { error: linkError } = await supabase.from('group_people').insert({
          group_id: groupId,
          person_id: newPerson.id,
        });

        if (linkError) {
          // If linking fails, we should delete the person we just created
          await supabase.from('people').delete().eq('id', newPerson.id);
          if (linkError.message.includes('row-level security')) {
            throw new Error(
              'Permission denied: RLS policy prevents linking person to group. In Supabase: Database → Tables → group_people → RLS toggle OFF (or create INSERT policy).',
            );
          }
          throw linkError;
        }

        toast.success(`${name} added!`);
      }

      // Reset and close modal
      setFormData({
        name: '',
        gender: 'other',
      });
      setPreview('');
      setSelectedFile(null);
      setOriginalImage('');
      setShowCropper(false);
      onOpenChange(false);

      // Let real-time subscription handle the update
    } catch (err: unknown) {
      logError(err);
      toast.error('Error: ' + getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Person' : 'Add Person'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the person's information below" : "Enter the person's information below"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="relative flex flex-col gap-4" suppressHydrationWarning>
          <div className="flex flex-col gap-2" suppressHydrationWarning>
            <Label htmlFor="name">
              Name{' '}
              <span className="text-destructive" aria-label="required">
                *
              </span>
            </Label>
            <div suppressHydrationWarning>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
                autoComplete="one-time-code"
                data-1p-ignore
                data-lpignore="true"
                required
                aria-required="true"
                aria-invalid={duplicateError ? 'true' : 'false'}
                aria-describedby={duplicateError ? 'name-error' : undefined}
                disabled={loading}
                className={duplicateError ? 'border-destructive' : ''}
              />
              {duplicateError && (
                <p id="name-error" className="text-destructive mt-1 text-sm">
                  {duplicateError}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2" suppressHydrationWarning>
            <Label htmlFor="gender">
              Gender{' '}
              <span className="text-destructive" aria-label="required">
                *
              </span>
            </Label>
            <div suppressHydrationWarning>
              <Listbox
                id="gender"
                value={formData.gender}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    gender: value as GenderType,
                  })
                }
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2" suppressHydrationWarning>
            <Label>Photo</Label>

            {showCropper ? (
              <div className="flex flex-col gap-2" suppressHydrationWarning>
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
                  <div
                    style={{
                      position: 'absolute',
                      top: `${(cropY / imageDimensions.height) * 100}%`,
                      left: 0,
                      width: `${(cropX / imageDimensions.width) * 100}%`,
                      height: `${(cropSize / imageDimensions.height) * 100}%`,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: `${(cropY / imageDimensions.height) * 100}%`,
                      right: 0,
                      width: `${((imageDimensions.width - cropX - cropSize) / imageDimensions.width) * 100}%`,
                      height: `${(cropSize / imageDimensions.height) * 100}%`,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Crop box */}
                  <div
                    onMouseDown={handleCropBoxMouseDown}
                    style={{
                      position: 'absolute',
                      left: `${(cropX / imageDimensions.width) * 100}%`,
                      top: `${(cropY / imageDimensions.height) * 100}%`,
                      width: `${(cropSize / imageDimensions.width) * 100}%`,
                      height: `${(cropSize / imageDimensions.height) * 100}%`,
                      border: '2px solid white',
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0)',
                      cursor: draggingBox ? 'grabbing' : 'grab',
                    }}
                  >
                    {/* Corner resize handles */}
                    {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
                      <div
                        key={corner}
                        onMouseDown={(e) => handleResizeMouseDown(e, corner)}
                        style={{
                          position: 'absolute',
                          width: '12px',
                          height: '12px',
                          backgroundColor: 'white',
                          border: '1px solid #666',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          ...(corner === 'top-left' && { top: '-6px', left: '-6px' }),
                          ...(corner === 'top-right' && { top: '-6px', right: '-6px' }),
                          ...(corner === 'bottom-left' && { bottom: '-6px', left: '-6px' }),
                          ...(corner === 'bottom-right' && { bottom: '-6px', right: '-6px' }),
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="button" onClick={applyCrop} className="flex-1">
                    Apply Crop
                  </Button>
                  <Button type="button" onClick={cancelCrop} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : preview ? (
              <div className="flex flex-col gap-2">
                <div className="w-full overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Preview" className="h-auto w-full" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPreview('');
                    setSelectedFile(null);
                  }}
                  disabled={loading}
                >
                  Remove Photo
                </Button>
              </div>
            ) : (
              <div
                className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-input'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {imageLoading ? (
                  <>
                    <div className="border-t-primary border-r-primary h-8 w-8 animate-spin rounded-full border-2 border-transparent"></div>
                    <p className="text-muted-foreground text-sm">Processing image...</p>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground text-sm">Drag and drop an image here, or</p>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={loading}
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      Choose Image
                    </Button>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    <p className="text-muted-foreground text-xs">JPEG or PNG, max 1MB</p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !!duplicateError} className="flex-1">
              {loading ? 'Saving...' : isEditMode ? 'Update Person' : 'Add Person'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
