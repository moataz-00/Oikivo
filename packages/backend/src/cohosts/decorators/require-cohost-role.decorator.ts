import { SetMetadata } from '@nestjs/common';

/**
 * When applied to a CoHostGuard-protected route, only co-hosts with
 * the specified role (plus the property owner) will be granted access.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, CoHostGuard)
 *   @RequireCoHostRole('cleaner')
 *   @Get('cleaner-tasks')
 *   getCleanerTasks() { ... }
 */
export const RequireCoHostRole = (role: 'co_host' | 'cleaner') =>
  SetMetadata('cohost_role', role);
