interface Nothing {}

/**
 * A non-literal type which provides a finite set of literal hints for editor
 * ergonomics. Whereas `"a" | "b" | string` will be optimized to just `string`
 * and lose autocompletion for "a" and "b", `HintedUnion<"a" | "b", string>`
 * will preserve the literals for autocompletion, while still accepting any
 * string. The resulting type will be type-equivalent to `LiteralUnion |
 * Catchall`. Typically everything in `LiteralUnion` will extend `Catchall`, and
 * thus the resulting type is also type-equivalent to just `Catchall`, but this
 * is not required.
 *
 * @see https://github.com/microsoft/TypeScript/issues/29729#issuecomment-1483854699
 *
 * @param LiteralUnion A union of literal values to autocomplete in editors.
 * @param Catchall A more general type to accept.
 *
 * @example
 * type Name = HintedUnion<"Jane" | "John", string>;
 * const name1: Name = <insertion point> // Autocompletes "Jane" and "John"
 * const name2: Name = "Eleanor"         // Still accepts any string
 */
export type HintedUnion<LiteralUnion, Catchall> =
  | LiteralUnion
  | (Catchall & Nothing);

/**
 * When wrapped around the definition of a type alias, convinces TypeScript to
 * preserve the type alias name in error output. Useful when the name of an
 * alias is more useful to people debugging than the details of its definition.
 *
 * Has the unfortunate side-effect of the result always extending object, even
 * when it shouldn't. This may be a problem for some use cases, so use
 * judiciously.
 */
export type Preserved<T> = T & {};
