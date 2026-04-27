import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformSettingEntity } from '../entities/platform-setting.entity';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/** Public endpoint — no auth required. Used by the web frontend middleware to check maintenance mode. */
@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(
    @InjectRepository(PlatformSettingEntity)
    private readonly settingsRepo: Repository<PlatformSettingEntity>,
  ) {}

  @Get('maintenance-status')
  @ApiOperation({ summary: 'Get current maintenance mode status (public, no auth)' })
  async getMaintenanceStatus() {
    const [modeSetting, msgSetting] = await Promise.all([
      this.settingsRepo.findOne({ where: { key: 'maintenance_mode' } }),
      this.settingsRepo.findOne({ where: { key: 'maintenance_message' } }),
    ]);

    return {
      maintenance: modeSetting?.value === 'true',
      message: msgSetting?.value ?? 'Platform is under maintenance. Please try again later.',
    };
  }
}
