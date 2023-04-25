import { initTRPC } from '@trpc/server';
import { awsLambdaRequestHandler } from '@trpc/server/adapters/aws-lambda';
import { provideActor } from '@unbind/core/actors';
import { Organizations } from '@unbind/core/organizations';
import { Users } from '@unbind/core/users';
import { ApiHandler } from 'sst/node/api';
import { useSession } from 'sst/node/future/auth';
import { z } from 'zod';

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
});

export type Router = typeof router;

const trpc = awsLambdaRequestHandler({
  router,
  createContext: async () => {
    const session = useSession();
    console.log(session);
    provideActor(session);
  },
});

export const handler = ApiHandler(async (req, ctx) => {
  return trpc(req, ctx);
});
