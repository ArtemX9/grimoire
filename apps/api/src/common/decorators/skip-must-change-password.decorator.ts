import { SetMetadata } from '@nestjs/common';

export const SKIP_MUST_CHANGE_PASSWORD = 'skipMustChangePassword';
export const SkipMustChangePassword = () => SetMetadata(SKIP_MUST_CHANGE_PASSWORD, true);
