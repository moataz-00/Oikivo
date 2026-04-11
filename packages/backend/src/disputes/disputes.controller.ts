import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, ParseIntPipe,
  BadRequestException, UseInterceptors, UploadedFiles,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../entities/user.entity';

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

const disputeEvidenceStorage = diskStorage({
  destination: (req, file, cb) => {
    const disputeId = req.params.id;
    const dir = join(process.cwd(), 'uploads', 'disputes', disputeId);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `evidence-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

const evidenceFilter = (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
  // Allow images, PDFs, and documents
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif|pdf|doc|docx)$/)) {
    return cb(new BadRequestException('Only images, PDFs, and documents are allowed'), false);
  }
  cb(null, true);
};

@ApiTags('disputes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @ApiOperation({ summary: 'Open a dispute for a completed or cancelled booking' })
  create(@CurrentUser() user: UserEntity, @Body() dto: CreateDisputeDto) {
    return this.disputesService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get my disputes' })
  getMyDisputes(@CurrentUser() user: UserEntity) {
    return this.disputesService.getMyDisputes(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single dispute by ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.disputesService.findOne(id, user.id);
  }

  @Patch(':id/update')
  @ApiOperation({ summary: 'Append additional information or evidence to an open dispute' })
  appendUpdate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body('message') message: string,
  ) {
    if (!message?.trim()) throw new BadRequestException('Message is required');
    return this.disputesService.appendUpdate(id, user.id, message);
  }

  // ─── FIX DISP-G1: Evidence upload endpoints ────────────────────────────────

  @Post(':id/evidence')
  @ApiOperation({ summary: 'Upload evidence files for a dispute (up to 10 files)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: disputeEvidenceStorage,
      fileFilter: evidenceFilter,
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file
    }),
  )
  async uploadEvidence(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    let dispute = await this.disputesService.findOne(id, user.id);

    // Add each file to the dispute evidence array
    for (const file of files) {
      const relativePath = `/uploads/disputes/${id}/${file.filename}`;
      dispute = await this.disputesService.addEvidence(id, user.id, relativePath);
    }

    return {
      message: `${files.length} evidence file(s) uploaded successfully`,
      evidence: dispute.evidence,
    };
  }

  @Delete(':id/evidence')
  @ApiOperation({ summary: 'Remove evidence file from dispute' })
  removeEvidence(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body('filePath') filePath: string,
  ) {
    if (!filePath?.trim()) throw new BadRequestException('File path is required');
    return this.disputesService.removeEvidence(id, user.id, filePath);
  }

  // ─── FIX DISP-G2: Appeal endpoints ─────────────────────────────────────────

  @Post(':id/appeal')
  @ApiOperation({ summary: 'Request an appeal for a resolved dispute' })
  requestAppeal(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body('reason') reason: string,
  ) {
    if (!reason?.trim()) throw new BadRequestException('Appeal reason is required');
    return this.disputesService.requestAppeal(id, user.id, reason);
  }

  @Get('appeals/pending')
  @ApiOperation({ summary: 'Get all disputes with pending appeals (admin only)' })
  getPendingAppeals() {
    return this.disputesService.getDisputesWithPendingAppeals();
  }

  @Patch(':id/appeal/resolve')
  @ApiOperation({ summary: 'Review and resolve an appeal (senior admin only)' })
  resolveAppeal(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
    @Body('resolution') resolution: string,
  ) {
    if (!resolution?.trim()) throw new BadRequestException('Resolution is required');
    return this.disputesService.resolveAppeal(id, user.id, resolution);
  }
}
