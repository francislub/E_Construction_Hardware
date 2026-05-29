// app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const f = createUploadthing();

export const ourFileRouter = {
  // Matches the slug "productImage" used in useUploadThing('productImage')
  productImage: f({ image: { maxFileSize: '4MB', maxFileCount: 8 } })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) throw new Error('Unauthorized');
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Called server-side after each file finishes uploading.
      // Return value is forwarded to the client's onClientUploadComplete callback.
      console.log('[uploadthing] upload complete for userId:', metadata.userId);
      console.log('[uploadthing] file url:', file.ufsUrl ?? file.url);
      return { uploadedBy: metadata.userId, ufsUrl: file.ufsUrl ?? file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;