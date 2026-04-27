import {
  Controller,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { randomUUID } from 'crypto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../entities/user.entity';
import { UploadsService } from './uploads.service';

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function makeImageStorage(subDir: string) {
  return diskStorage({
    destination: (req, file, cb) => {
      const id = req.params.id || req.params.propertyId;
      const dir = join(process.cwd(), 'uploads', subDir, id);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      // FIX O8: Use crypto.randomUUID instead of Math.random to eliminate collision risk
      cb(null, `photo-${Date.now()}-${randomUUID()}${extname(file.originalname)}`);
    },
  });
}

const imageFilter = (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
    return cb(new BadRequestException('Only image files are allowed'), false);
  }
  cb(null, true);
};

// SEC: Magic-byte validation — verify file content matches claimed image type
const IMAGE_MAGIC_BYTES: Array<{ ext: string; bytes: number[] }> = [
  { ext: 'jpg',  bytes: [0xFF, 0xD8, 0xFF] },              // JPEG
  { ext: 'png',  bytes: [0x89, 0x50, 0x4E, 0x47] },        // PNG
  { ext: 'gif',  bytes: [0x47, 0x49, 0x46] },               // GIF
  { ext: 'webp', bytes: [0x52, 0x49, 0x46, 0x46] },         // WebP (RIFF)
];

function validateImageMagicBytes(filePath: string): boolean {
  try {
    const buf = Buffer.alloc(12);
    const fd = require('fs').openSync(filePath, 'r');
    require('fs').readSync(fd, buf, 0, 12, 0);
    require('fs').closeSync(fd);
    return IMAGE_MAGIC_BYTES.some(({ bytes }) =>
      bytes.every((b, i) => buf[i] === b),
    );
  } catch {
    return false;
  }
}

function validateUploadedFiles(files: Express.Multer.File[]): void {
  for (const file of files) {
    if (!validateImageMagicBytes(file.path)) {
      // Delete the spoofed file immediately
      try { unlinkSync(file.path); } catch { /* best-effort cleanup */ }
      throw new BadRequestException(`File "${file.originalname}" is not a valid image (magic bytes mismatch)`);
    }
  }
}

@ApiTags('uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  // ─── Property photos ────────────────────────────────────────────────────────

  @Post('photos/:id')
  @ApiOperation({ summary: 'Upload photos for a property (up to 20)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: makeImageStorage('properties'),
      fileFilter: imageFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadPhotos(
    @Param('id', ParseIntPipe) propertyId: number,
    @CurrentUser() user: UserEntity,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    validateUploadedFiles(files);
    return this.uploadsService.savePropertyPhotos(propertyId, user.id, files);
  }

  @Delete('photos/:photoId')
  @ApiOperation({ summary: 'Delete a property photo' })
  async deletePhoto(
    @Param('photoId', ParseIntPipe) photoId: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.uploadsService.deletePropertyPhoto(photoId, user.id);
  }

  @Patch('photos/:photoId/cover')
  @ApiOperation({ summary: 'Set a photo as the cover photo' })
  async setCover(
    @Param('photoId', ParseIntPipe) photoId: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.uploadsService.setCoverPhoto(photoId, user.id);
  }

  @Patch('photos/reorder')
  @ApiOperation({ summary: 'Reorder property photos' })
  async reorderPhotos(
    @CurrentUser() user: UserEntity,
    @Body() body: { photoOrders: Array<{ id: number; displayOrder: number }> },
  ) {
    return this.uploadsService.reorderPhotos(user.id, body.photoOrders);
  }

  // ─── Experience photos ────────────────────────────────────────────────────────

  @Post('experience-photos/:id')
  @ApiOperation({ summary: 'Upload photos for an experience (up to 10)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: makeImageStorage('experiences'),
      fileFilter: imageFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadExperiencePhotos(
    @Param('id', ParseIntPipe) experienceId: number,
    @CurrentUser() user: UserEntity,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    validateUploadedFiles(files);
    return this.uploadsService.saveExperiencePhotos(experienceId, user.id, files);
  }

  @Delete('experience-photos/:photoId')
  @ApiOperation({ summary: 'Delete an experience photo' })
  async deleteExperiencePhoto(
    @Param('photoId', ParseIntPipe) photoId: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.uploadsService.deleteExperiencePhoto(photoId, user.id);
  }

  // ─── Avatar ──────────────────────────────────────────────────────────────────

  @Post('avatar')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'avatars');
          ensureDir(dir);
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          cb(null, `avatar-${Date.now()}-${randomUUID()}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: UserEntity,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    validateUploadedFiles([file]);
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.uploadsService.updateAvatar(user.id, avatarUrl);
  }
}
