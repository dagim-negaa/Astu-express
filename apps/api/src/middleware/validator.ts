import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import { z } from "zod";

/**
 * Standardized Zod validator middleware for Hono routes.
 * Returns HTTP 400 with both RFC-compatible and application-standard error format:
 * {
 *   success: false,
 *   error: string,
 *   fieldErrors: Record<string, string[]>,
 *   issues: z.ZodIssue[]
 * }
 */
export const validate = <
  T extends z.ZodType,
  Target extends keyof ValidationTargets
>(
  target: Target,
  schema: T
) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const flattened = z.flattenError(result.error);
      const fieldErrors = (flattened.fieldErrors || {}) as Record<
        string,
        string[] | undefined
      >;
      const firstField = Object.keys(fieldErrors)[0];
      const errorMessage =
        flattened.formErrors[0] ||
        (firstField && fieldErrors[firstField]?.[0]
          ? `${firstField}: ${fieldErrors[firstField]![0]}`
          : undefined) ||
        result.error.issues[0]?.message ||
        "Validation failed";

      return c.json(
        {
          success: false,
          error: errorMessage,
          fieldErrors: fieldErrors as Record<string, string[]>,
          issues: result.error.issues,
        },
        400
      );
    }
  });

export const validateJson = <T extends z.ZodType>(schema: T) =>
  validate("json", schema);

export const validateQuery = <T extends z.ZodType>(schema: T) =>
  validate("query", schema);

export const validateParam = <T extends z.ZodType>(schema: T) =>
  validate("param", schema);
