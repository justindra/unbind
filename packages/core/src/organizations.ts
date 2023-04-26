import { EntityItem, createSchema } from 'electrodb';
import { generateOrganizationEntityDetails } from 'jfsi/node/entities';
import { Configuration } from './dynamo';
import { Users } from './users';
import { zod } from './zod';
import { z } from 'zod';
import { assertActor } from './actors';

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

/**
 * Set the OpenAI API Key to use for the active organization
 * @param apiKey The key to set
 * @returns
 */
export const setOpenAIKey = zod(
  z
    .string()
    .startsWith('sk-', 'This does not look like an OpenAI API Key')
    .min(50, 'This does not look like an OpenAI API Key'),
  async (apiKey: string) => {
    const actor = assertActor('user');

    const res = await OrgBase.OrganizationEntity.update({
      organizationId: actor.properties.organizationId,
    })
      .set({ openAIApiKey: apiKey })
      .go({ response: 'updated_new' });

    return res.data.openAIApiKey;
  }
);

/**
 * Get the OpenAI Key for the active organization
 */
export const getOpenAIKey = zod(z.void(), async () => {
  const actor = assertActor('user');

  const res = await OrgBase.OrganizationEntity.get({
    organizationId: actor.properties.organizationId,
  }).go();

  return !!res.data?.openAIApiKey;
});

export const Organizations = {
  ...OrgBase,
  setOpenAIKey,
  getOpenAIKey,
};
