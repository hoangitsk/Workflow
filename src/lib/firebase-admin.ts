import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  // To verify ID tokens, we only need the projectId. 
  // No full service account is needed if we are just doing token verification.
  initializeApp({
    projectId: "yniemdienanh-fb0b7",
  });
}

export const adminAuth = getAuth();
