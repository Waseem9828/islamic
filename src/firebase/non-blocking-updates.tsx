
'use client';

import {
  doc,
  setDoc,
  updateDoc,
  Firestore,
  DocumentReference,
  CollectionReference,
  SetOptions,
  WithFieldValue,
  DocumentData,
} from 'firebase/firestore';
import { errorEmitter } from './errors';
import { FirestorePermissionError, type SecurityRuleContext } from './errors';

/**
 * A non-blocking wrapper for Firestore's setDoc function that handles permission errors.
 * It does not await the operation, allowing for optimistic UI updates.
 */
export function setDocumentNonBlocking<T>(
  reference: DocumentReference<T>,
  data: WithFieldValue<T>,
  options: SetOptions
): void {
  setDoc(reference, data, options).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: reference.path,
      operation: 'write', // Covers create and merge/update
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

/**
 * A non-blocking wrapper for Firestore's updateDoc function that handles permission errors.
 */
export function updateDocumentNonBlocking(
  reference: DocumentReference<DocumentData>,
  data: WithFieldValue<DocumentData>
): void {
  updateDoc(reference, data).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: reference.path,
      operation: 'update',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}
