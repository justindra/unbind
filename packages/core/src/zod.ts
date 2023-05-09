import { z } from 'zod';
import { DateTime } from 'luxon';

/**
 * A wrapper around a function to allow us to validate the inputs using Zod.
 * @param schema The schema of the input
 * @param func The function to run once input is validated
 * @returns
 */
export function zod<
  Schema extends z.ZodSchema<any, any, any>,
  Return extends any
>(schema: Schema, func: (value: z.input<Schema>) => Return) {
  const result = (input: z.input<Schema>, skipParse?: boolean) => {
    const parsed = skipParse ? input : result.schema.parse(input);
    return func(parsed);
  };
  result.schema = schema;
  return result;
}

/**
 * A zod schema for a string that is a valid ISO8601 date
 */
export const iso8601 = () =>
  z
    .string()
    .refine(DateTime.fromISO, { message: 'Not a valid ISO string date' });
