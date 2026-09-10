export interface BufferInput {
  itemBefore?: number | null;
  itemAfter?: number | null;
  categoryBefore?: number | null;
  categoryAfter?: number | null;
  businessBefore: number;
  businessAfter: number;
}

export function resolveEffectiveBuffer(input: BufferInput): { before: number; after: number } {
  return {
    before: input.itemBefore ?? input.categoryBefore ?? input.businessBefore,
    after: input.itemAfter ?? input.categoryAfter ?? input.businessAfter,
  };
}

export function getOperationalPeriod(
  eventStart: Date,
  eventEnd: Date,
  before: number,
  after: number
): { effectiveStart: Date; effectiveEnd: Date } {
  return {
    effectiveStart: new Date(eventStart.getTime() - before * 60_000),
    effectiveEnd: new Date(eventEnd.getTime() + after * 60_000),
  };
}
