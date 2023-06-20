# Queries

_This is highly in-progress…_

- The result of a query is always a valid JSON-LD document, possibly containing
  additional keywords (beginning with `@`). When interpreted as a JSON-LD
  document (and thus ignoring keywords unknown to JSON-LD), the document
  describes a set of facts which is a subset of the facts in the original,
  queried document.

  - Some keywords may introduce information which is not in the original
    document, nor valid in the original document. In particular, aggregations
    will not be correct in the context of the original document if the query has
    filtered the results: the count of a set in the original document will not
    match the count of that set after filtering it (if the filter removes any
    elements). Such information is _always_ nested within some `@` keyword which
    JSON-LD will ignore.

- The result of a query always has the same key structure as the query itself,
  except:

  - An object value may match more than one object, and thus become an array.
  - Variables may match more than one value, and thus become an array.
  - _We may need more exceptions here._

- (?) When matching a node, every given property much match, unless the property
  has `@optional: true`.

- (?) Variable names are scoped. _Needs more detail if true._
