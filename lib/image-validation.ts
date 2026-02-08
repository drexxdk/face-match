import toast from 'react-hot-toast';

// Image upload constants
export const IMAGE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 1024 * 1024, // 1 MB in bytes
  VALID_TYPES: ['image/jpeg', 'image/png'],
  JPEG_QUALITY: 0.85,
} as const;

/**
 * Validates an image file for type and size
 * @param file The file to validate
 * @returns true if valid, false otherwise (shows error toast)
 */
export function validateImageFile(file: File): boolean {
  // Check file type
  if (!IMAGE_UPLOAD_CONFIG.VALID_TYPES.includes(file.type)) {
    toast.error('Please select a JPEG or PNG image');
    return false;
  }

  // Check file size
  if (file.size > IMAGE_UPLOAD_CONFIG.MAX_FILE_SIZE) {
    toast.error('File size must be less than 1 MB');
    return false;
  }

  return true;
}

/**
 * Checks if a file type is a valid image type
 * @param type The MIME type to check
 * @returns true if valid image type
 */
export function isValidImageType(type: string): boolean {
  return IMAGE_UPLOAD_CONFIG.VALID_TYPES.includes(type);
}
