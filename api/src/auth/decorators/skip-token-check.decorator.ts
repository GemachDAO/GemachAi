import { SetMetadata } from '@nestjs/common';

export const SKIP_TOKEN_CHECK = 'skipTokenCheck';
export const SkipTokenCheck = () => SetMetadata(SKIP_TOKEN_CHECK, true);
