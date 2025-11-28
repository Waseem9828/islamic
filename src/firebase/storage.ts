
import { getStorage, ref, deleteObject, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Deletes a file from Firebase Storage using its full URL.
 * @param {string} url The full HTTPS URL of the file to delete.
 * @returns {Promise<void>}
 */
export const deleteFileByUrl = async (url: string): Promise<void> => {
  const storage = getStorage();
  // Create a reference from the HTTPS URL
  const fileRef = ref(storage, url);

  try {
    await deleteObject(fileRef);
    console.log('File deleted successfully:', url);
  } catch (error) {
    console.error('Error deleting file:', error);
    // We don't rethrow the error to prevent cascading failures if a file doesn't exist.
  }
};

/**
 * Uploads a file to a specified folder in Firebase Storage with progress tracking.
 * @param {File} file The file to upload.
 * @param {string} folder The destination folder (e.g., 'profileImages').
 * @param {string} fileName The desired name for the file.
 * @param {(progress: number) => void} [onProgress] Optional callback to track upload progress (0-100).
 * @returns {Promise<string>} A promise that resolves with the public download URL of the file.
 */
export const uploadFile = (
    file: File, 
    folder: string, 
    fileName: string, 
    onProgress?: (progress: number) => void
): Promise<string> => {
    const storage = getStorage();
    const path = `${folder}/${fileName}`;
    const storageRef = ref(storage, path);

    return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                // Calculate and report progress
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                if (onProgress) {
                    onProgress(progress);
                }
            },
            (error) => {
                // Handle unsuccessful uploads
                console.error("Error uploading file:", error);
                switch (error.code) {
                    case 'storage/unauthorized':
                        reject(new Error('Permission denied. Please check your storage rules.'));
                        break;
                    case 'storage/canceled':
                        reject(new Error('Upload was canceled.'));
                        break;
                    default:
                        reject(new Error('An unknown error occurred during upload.'));
                        break;
                }
            },
            async () => {
                // Handle successful uploads on complete
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                } catch (error) {
                     console.error("Error getting download URL:", error);
                     reject(new Error('Could not get download URL after upload.'));
                }
            }
        );
    });
};
