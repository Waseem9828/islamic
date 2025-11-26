import { getSafeServerAdmin } from '@/lib/firebase/server-init';

// Get the initialized instances from the safe initializer.
const { auth, db } = getSafeServerAdmin();

export { auth, db };
