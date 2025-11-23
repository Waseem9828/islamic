
import { getStorage, ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';

// Function to delete a file from Firebase Storage using its URL
export const deleteFileByUrl = async (url: string): Promise<void> => {
  const storage = getStorage();
  const fileRef = ref(storage, url);

  try {
    await deleteObject(fileRef);
    console.log('File deleted successfully');
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Function to upload a file to Firebase Storage
export const uploadFile = async (file: File, folder: string, fileName: string): Promise<string> => {
    const storage = getStorage();
    const path = `${folder}/${fileName}`;
    const storageRef = ref(storage, path);

    try {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
};
