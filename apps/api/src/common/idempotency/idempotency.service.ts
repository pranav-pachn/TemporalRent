import crypto from 'crypto';
import { Prisma, IdempotencyOperation } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../lib/errors';

export interface IdempotentExecutionOptions<T> {
  businessId: string;
  key: string;
  operation: IdempotencyOperation;
  bookingId: string;
  payload: any;
  execute: () => Promise<{ statusCode: number; body: T }>;
}

export class IdempotencyService {
  /**
   * Deterministically serializes JSON objects with sorted keys recursively.
   */
  public canonicalize(obj: any): string {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }
    
    if (Array.isArray(obj)) {
      const arr = obj.map(item => JSON.parse(this.canonicalize(item)));
      return JSON.stringify(arr);
    }
    
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj: Record<string, any> = {};
    for (const key of sortedKeys) {
      if (obj[key] !== undefined) {
        sortedObj[key] = JSON.parse(this.canonicalize(obj[key]));
      }
    }
    return JSON.stringify(sortedObj);
  }

  /**
   * Calculates SHA-256 hex hash from canonicalized payload.
   */
  public hashPayload(payload: any): string {
    const canonicalStr = this.canonicalize(payload ?? {});
    return crypto.createHash('sha256').update(canonicalStr).digest('hex');
  }

  /**
   * Executes a mutation idempotently, ensuring concurrent safety and caching domain rejections.
   */
  public async executeIdempotent<T>(options: IdempotentExecutionOptions<T>): Promise<{ statusCode: number; body: any }> {
    const { businessId, key, operation, bookingId, payload, execute } = options;
    const requestHash = this.hashPayload(payload);

    try {
      // 1. Acquire idempotency key BEFORE starting the main mutation transaction
      await prisma.idempotencyRecord.create({
        data: {
          businessId,
          key,
          operation,
          bookingId,
          requestHash,
          status: 'PROCESSING',
          statusCode: 0,
          responseBody: {},
        }
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        const existing = await prisma.idempotencyRecord.findUnique({
          where: { businessId_key: { businessId, key } }
        });
        
        if (existing) {
          // 2. Hash & Operation validation on replay
          if (existing.operation !== operation || existing.requestHash !== requestHash) {
            throw new ApiError(409, 'IDEMPOTENCY_KEY_REUSE', 'Idempotency key was already used with different parameters or operation');
          }
          if (existing.status === 'PROCESSING') {
            throw new ApiError(409, 'CONCURRENT_REQUEST', 'Request is already processing');
          }
          return { statusCode: existing.statusCode, body: existing.responseBody };
        }
      }
      throw error;
    }

    let result;
    let isDomainRejection = false;

    try {
      // 3. Execute mutation inside its own transaction (handled by execute wrapper)
      result = await execute();
    } catch (error: any) {
      if (
        error instanceof ApiError &&
        (error.code === 'INVENTORY_CONFLICT' ||
         error.code === 'INVALID_STATUS_TRANSITION' ||
         error.code === 'IDEMPOTENCY_KEY_REUSE' ||
         error.code === 'INVALID_BOOKING_STATUS')
      ) {
        // Deterministic domain rejection -> cache it
        result = { statusCode: error.statusCode, body: { code: error.code, message: error.message, items: (error as any).items, conflicts: (error as any).conflicts } };
        isDomainRejection = true;
      } else {
        // Infrastructure or unexpected error -> abandon the processing record so it can be retried
        await prisma.idempotencyRecord.delete({ where: { businessId_key: { businessId, key } } }).catch(() => {});
        throw error;
      }
    }

    // 4. Cache response
    await prisma.idempotencyRecord.update({
      where: { businessId_key: { businessId, key } },
      data: {
        status: 'COMPLETED',
        statusCode: result.statusCode,
        responseBody: (result.body as unknown) as Prisma.InputJsonValue,
      }
    });

    if (isDomainRejection) {
      const body = result.body as any;
      const apiErr: any = new ApiError(result.statusCode, body.code, body.message);
      apiErr.items = body.items;
      apiErr.conflicts = body.conflicts;
      throw apiErr;
    }

    return result;
  }
}
