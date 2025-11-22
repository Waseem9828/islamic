import { getStorage, ref, deleteObject } from 'firebase/storage';

// Function to delete a file from Firebase Storage using its URL
export const deleteFileByUrl = async (url: string): Promise<void> => {
  const storage = getStorage();
  // Create a reference to the file to delete
  // This assumes the URL is a standard Firebase Storage URL
  const fileRef = ref(storage, url);

  try {
    // Delete the file
    await deleteObject(fileRef);
    console.log('File deleted successfully');
  } catch (error) {
    // Uh-oh, an error occurred!
    console.error('Error deleting file:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
};