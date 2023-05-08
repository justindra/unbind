import { initTRPC } from '@trpc/server';
import { awsLambdaRequestHandler } from '@trpc/server/adapters/aws-lambda';
import { provideActor } from '@unbind/core/actors';
import { Chats } from '@unbind/core/entities/chats';
import { Documents } from '@unbind/core/entities/documents';
import { Organizations } from '@unbind/core/entities/organizations';
import { Users } from '@unbind/core/entities/users';
import { ApiHandler } from 'sst/node/api';
import { useSession } from 'sst/node/future/auth';
import { ZodError, z } from 'zod';

export function query<
  S extends z.ZodSchema<any, any, any>,
  Fn extends (input: any) => any
>(fn: Fn & { schema: S }) {
  return t.procedure.input<S>(fn.schema).query((req) => {
    return fn(req.input) as Awaited<ReturnType<Fn>>;
  });
}

export function mutation<
  S extends z.ZodSchema<any, any, any>,
  Fn extends (input: any) => any
>(fn: Fn & { schema: S }) {
  return t.procedure.input(fn.schema).mutation((req) => {
    return fn(req.input) as Awaited<ReturnType<typeof fn>>;
  });
}

export const t = initTRPC.create();

export const router = t.router({
  user_by_id: query(Users.getUserById),
  set_open_ai_key: mutation(Organizations.setOpenAIKey),
  get_open_ai_key: query(Organizations.getOpenAIKey),
  create_document: mutation(Documents.createDocument),
  get_upload_url: mutation(Documents.getUploadUrl),
  get_document_by_id: query(Documents.getDocumentById),
  list_documents: query(Documents.listDocuments),
  get_upload_urls_for_new_document: mutation(
    Documents.getUploadUrlsForNewDocument
  ),
  send_message: mutation(Chats.sendMessage),
});

export type Router = typeof router;

const trpc = awsLambdaRequestHandler({
  router,
  createContext: async () => {
    const session = useSession();
    provideActor(session);
  },
  onError({ error }) {
    if (error.cause instanceof ZodError) {
      error.message = JSON.parse(error.message)[0].message;
    }
  },
});

export const handler = ApiHandler(async (req, ctx) => {
  return trpc(req, ctx);
});
