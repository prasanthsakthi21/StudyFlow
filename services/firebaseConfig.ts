// Firebase Configuration (MOCK MODE)
// Real Firebase is disabled due to dependency install issues on your environment.
// This file assumes a "Mock" behavior where uploads go to the local backend.

const storage = null; // Forces app to use local mock logic

console.log('Firebase Config: Using LOCAL MOCK STORAGE (Robust Mode)');

export { storage };
