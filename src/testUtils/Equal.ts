import { type Equal as _Equal } from "type-plus";

/**
 * Like `type-plus`'s `Equal`, but will display the actual and expected types in
 * the error message.
 *
 * @example
 * // Expect two types to be equal:
 * true satisfies Equal<number, number>; // No errors.
 * true satisfies Equal<number, string>; // Error: Type 'true' does not satisfy
 *                                       // the expected type 'false | {
 *                                       // expected: string; actual: number; }'
 *
 * // Expect two types not to be equal:
 * false satisfies Equal<number, number>; // Error: Type 'false' does not
 *                                        // satisfy the expected type 'true | {
 *                                        // expected: number; actual: number;
 *                                        // }'
 * false satisfies Equal<number, string>; // No errors.
 */
export type Equal<Actual, Expected> = _Equal<
  Actual,
  Expected,
  true | { actual: Actual; expected: Expected },
  false | { actual: Actual; expected: Expected }
>;
