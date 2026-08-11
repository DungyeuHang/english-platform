import { getFirebaseServices } from './client';

export const { auth, firestore } = (() => {
  const services = getFirebaseServices();
  return {
    get auth() { return services.auth; },
    get firestore() { return services.firestore; },
  };
})();