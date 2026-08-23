import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  // To verify ID tokens, we only need the projectId. 
  // No full service account is needed if we are just doing token verification.
  admin.initializeApp({
    projectId: "yniemdienanh-fb0b7",
  });
}

export const adminAuth = admin.auth();
