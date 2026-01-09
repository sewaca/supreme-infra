import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodType) {}

  transform(value: unknown) {
    console.log('[test] value is: ', value);
    const result = this.schema.safeParse(value);
    console.log(`[test] validation result.success=${result.success}`);
    if (!result.success) {
      const errors = result.error.issues.map((err) => ({ path: err.path.join('.'), message: err.message }));
      throw new BadRequestException({ message: 'Validation failed', errors });
    }
    return result.data;
  }
}
