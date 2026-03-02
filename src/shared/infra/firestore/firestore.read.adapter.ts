/**
 * @fileoverview Firestore Read Adapter.
 * This file contains all read-only operations for Firestore, such as getDoc,
 * getDocs, and creating real-time listeners with onSnapshot.
 *
 * [D24] FIREBASE_ACL boundary: feature slices MUST import Firestore SDK
 *       utilities from this adapter (or firestore.write.adapter) rather than
 *       directly from 'firebase/firestore'.
 */

import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type CollectionReference,
  type DocumentData,
  type DocumentSnapshot,
  type FieldPath,
  type OrderByDirection,
  type Query,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
  type Unsubscribe,
  type WhereFilterOp,
  type FirestoreDataConverter,
} from 'firebase/firestore';

import { db } from './firestore.client';

// ---------------------------------------------------------------------------
// [D24] Re-exports — feature slices import these instead of 'firebase/firestore'
// ---------------------------------------------------------------------------
export {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
};
export type {
  CollectionReference,
  DocumentData,
  DocumentSnapshot,
  FieldPath,
  OrderByDirection,
  Query,
  QueryConstraint,
  QueryDocumentSnapshot,
  QuerySnapshot,
  Unsubscribe,
  WhereFilterOp,
};

/**
 * Fetches a single document from Firestore.
 * @param path The full path to the document (e.g., 'collection/docId').
 * @param converter An optional FirestoreDataConverter for type safety.
 * @returns A promise that resolves to the document data or null if not found.
 */
export const getDocument = async <T>(
  path: string,
  converter?: FirestoreDataConverter<T>
): Promise<T | null> => {
  if (converter) {
    const docRef = doc(db, path).withConverter(converter);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  }

  const docRef = doc(db, path);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as T) : null;
};

/**
 * Fetches multiple documents from a collection that match a query.
 * @param query The Firestore query to execute.
 * @returns A promise that resolves to an array of document data.
 */
export const getDocuments = async <T>(query: Query<T>): Promise<T[]> => {
  const querySnapshot = await getDocs(query);
  return querySnapshot.docs.map((doc) => doc.data());
};

/**
 * Creates a real-time subscription to a Firestore query.
 * @param query The Firestore query to listen to.
 * @param onUpdate A callback function that fires every time the query results change.
 * @returns An unsubscribe function to detach the listener.
 */
export const createSubscription = <T>(
  query: Query<T, DocumentData>,
  onUpdate: (data: T[]) => void
): Unsubscribe => {
  return onSnapshot(query, (querySnapshot) => {
    const data = querySnapshot.docs.map((doc) => doc.data());
    onUpdate(data);
  });
};

/**
 * Creates a real-time subscription to a single Firestore document.
 * [D24] Use this instead of calling `onSnapshot(doc(...))` directly in feature slices.
 *
 * @param path The full path to the document (e.g., 'accounts/userId').
 * @param onUpdate Callback fired with the document data (or null if it doesn't exist).
 * @returns An unsubscribe function to detach the listener.
 */
export const subscribeToDocument = <T extends object>(
  path: string,
  onUpdate: (data: (T & { id: string }) | null) => void
): Unsubscribe => {
  const docRef = doc(db, path);
  return onSnapshot(docRef, (snap) => {
    onUpdate(snap.exists() ? ({ id: snap.id, ...snap.data() } as T & { id: string }) : null);
  });
};
