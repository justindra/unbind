import { EntityItem, createSchema } from 'electrodb';
import { generateOrganizationEntityDetails } from 'jfsi/node/entities';
import { Configuration } from '../dynamo';
import { Users } from './users';
import { zod } from '../zod';
import { z } from 'zod';
import { assertActor } from '../actors';

// TODO: Investigate a better way to save the API Keys instead of saving it in
// DDB. Maybe use SSM or something?

const OrgBase = generateOrganizationEntityDetails(
  Configuration,
  {
    version: '1',
    service: 'unbind',
    organizationConfig: createSchema({
      model: { version: '1', service: 'unbind', entity: 'org' },
      attributes: {
        /** OpenAI's API Key to use for the organization */
        openAIApiKey: { type: 'string' },
        /** Pinecone's API Key */
        pineconeApiKey: { type: 'string' },
        /** Pinecone's Environment */
        pineconeEnvironment: { type: 'string' },
        /** Pinecone's Index */
        pineconeIndex: { type: 'string' },
      },
      indexes: {
        test: {
          index: 'gsi1',
          pk: { field: 'pk', composite: ['organizationId'] },
          sk: { field: 'sk', composite: [] },
        },
      },
    }),
  },
  Users
);

export type Info = EntityItem<typeof OrgBase.OrganizationEntity>;

function removeUndefinedKeys(
  keys: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(keys).filter(([_, value]) => value !== undefined)
  );
}

/**
 * Turn all the keys to just be a boolean true or false to specify whether or
 * not it has been set.
 */
function keysToBoolean<
  TInput extends Record<string, unknown>,
  TOutput extends Record<keyof TInput, boolean>
>(keys: TInput): TOutput {
  return Object.fromEntries(
    Object.entries(keys).map(([key, value]) => [key, Boolean(value)])
  ) as TOutput;
}

/**
 * Set all the API Keys for the current user's organization
 */
export const setApiKeys = zod(
  z.object({
    openAIApiKey: z
      .string()
      .startsWith('sk-', 'This does not look like an OpenAI API Key')
      .min(50, 'This does not look like an OpenAI API Key')
      .optional(),
    pineconeApiKey: z.string().optional(),
    pineconeEnvironment: z.string().optional(),
    pineconeIndex: z.string().optional(),
  }),
  async ({
    openAIApiKey,
    pineconeApiKey,
    pineconeEnvironment,
    pineconeIndex,
  }) => {
    const actor = assertActor('user');

    const res = await OrgBase.OrganizationEntity.update({
      organizationId: actor.properties.organizationId,
    })
      .set(
        removeUndefinedKeys({
          openAIApiKey,
          pineconeApiKey,
          pineconeEnvironment,
          pineconeIndex,
        })
      )
      .go({ response: 'all_new' });

    return keysToBoolean(res.data);
  }
);

/**
 * Get the API Keys for the active organization
 */
export const getApiKeys = zod(
  /** Organization Id to use */
  z.string().optional(),

  async (organizationId) => {
    const organizationIdToUse =
      organizationId ?? assertActor('user').properties.organizationId;

    const res = await OrgBase.OrganizationEntity.get({
      organizationId: organizationIdToUse,
    }).go();

    return {
      openAIApiKey: res.data?.openAIApiKey,
      pineconeApiKey: res.data?.pineconeApiKey,
      pineconeEnvironment: res.data?.pineconeEnvironment,
      pineconeIndex: res.data?.pineconeIndex,
    };
  }
);

/**
 * A wrapper around getting the API Keys but we hide the actual values. Used
 * for the frontend.
 */
export const getHiddenApiKeys = zod(
  z.string().optional(),
  async (organizationId) => keysToBoolean(await getApiKeys(organizationId))
);

export const Organizations = {
  ...OrgBase,
  setApiKeys,
  getApiKeys,
  getHiddenApiKeys,
};

type DeepNonNullable<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

/**
 * Assert that we have all of the required API Keys
 */
export function assertApiKeys<
  TKeys extends Awaited<ReturnType<typeof getApiKeys>>
>(keys: TKeys): asserts keys is DeepNonNullable<TKeys> {
  if (!keys.openAIApiKey) {
    throw new Error(`No OpenAI API key found for organization`);
  }
  if (
    !keys.pineconeApiKey ||
    !keys.pineconeEnvironment ||
    !keys.pineconeIndex
  ) {
    throw new Error(`No Pinecone keys found for organization`);
  }
}
