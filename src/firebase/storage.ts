'use client';

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/core';

/**
 * A reusable function to upload a file to Firebase Storage.
 *
 * @param file The file to upload.
 * @param userId The ID of the user uploading the file.
 * @param path The storage path (e.g., 'profile-pictures', 'deposit-screenshots').
 * @returns The download URL of the uploaded file.
 */
export const uploadFile = async (
  file: File,
  userId: string,
  path: string
): Promise<string> => {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized.');
  }

  if (!file) {
    throw new Error('No file selected for upload.');
  }

  if (!userId) {
    throw new Error('User is not authenticated.');
  }

  try {
    // Create a unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}.${fileExtension}`;
    const filePath = `${path}/${userId}/${fileName}`;

    const fileRef = ref(storage, filePath);

    // Upload the file
    const uploadResult = await uploadBytes(fileRef, file);

    // Get the download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);

    return downloadURL;
  } catch (error: any) {
    console.error('File upload error:', error);
    // Re-throw a more user-friendly error
    throw new Error(`Upload failed: ${error.message}`);
  }
};
