/**
 * Outbound port: somewhere to keep the most recent calculation.
 *
 * A contract the use case writes for itself, not a description of any
 * particular storage. The driver that supplies one lives outside this
 * package's inner circles and conforms to this interface.
 *
 * Walkthrough: `src/_example.result-log.README.md`.
 * Rules: `/CLEAN-ARCHITECTURE.md`.
 */

/**
 * What a use case reports about a finished calculation.
 *
 * Plain data on purpose: numbers, strings and arrays travel across any
 * boundary without dragging a framework along.
 */
export interface CalculationRecord {
  /** Which operation produced the value, e.g. `geometry.calculateRightTriangle`. */
  readonly operation: string;
  /** The arguments it was given, in call order. */
  readonly inputs: readonly number[];
  /** The single number worth remembering from the result. */
  readonly result: number;
}

/**
 * The capability a use case needs in order to remember its last answer.
 *
 * Async because every realistic implementation is — a file write, a network
 * call, a database round trip. Declaring it `Promise<void>` up front means
 * swapping an in-memory fake for a real driver never changes a signature.
 *
 * A rejection is left to propagate: the caller decides whether a failed write
 * invalidates the operation. The port does not swallow it and does not retry.
 */
export interface ResultLog {
  /**
   * Overwrites whatever was recorded before.
   *
   * @param entry - the calculation to remember
   */
  readonly recordLast: (entry: CalculationRecord) => Promise<void>;
}
