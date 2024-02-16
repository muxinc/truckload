import { encryptionMiddleware } from '@inngest/middleware-encryption';
import { Inngest } from 'inngest';

const mw = encryptionMiddleware({
  key: process.env.INNGEST_ENCRYPTION_KEY as string,
});

export const inngest = new Inngest({ id: 'in-n-out-video', middleware: [mw] });
