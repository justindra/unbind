import { z } from 'zod';
import { Context } from 'sst/context';

export const PublicActor = z.object({
  type: z.literal('public'),
  properties: z.object({}),
});
export type PublicActor = z.infer<typeof PublicActor>;

export const SystemActor = z.object({
  type: z.literal('system'),
  properties: z.object({}),
});
export type SystemActor = z.infer<typeof SystemActor>;

export const UserActor = z.object({
  type: z.literal('user'),
  properties: z.object({
    userId: z.string(),
    organizationId: z.string(),
  }),
});
export type UserActor = z.infer<typeof UserActor>;

export const Actor = z.discriminatedUnion('type', [
  UserActor,
  SystemActor,
  PublicActor,
]);
export type Actor = z.infer<typeof Actor>;

const ActorContext = Context.create<Actor>();

export const useActor = ActorContext.use;
export const provideActor = ActorContext.provide;

export function assertActor<T extends Actor['type']>(type: T) {
  const actor = useActor();
  if (actor.type !== type) {
    throw new Error(`Expected actor type "${type}" but got "${actor.type}"`);
  }
  return actor as Extract<Actor, { type: T }>;
}
