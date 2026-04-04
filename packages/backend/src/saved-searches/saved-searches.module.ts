import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedSearchEntity } from '../entities/saved-search.entity';
import { SavedSearchesService } from './saved-searches.service';
import { SavedSearchesController } from './saved-searches.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SavedSearchEntity])],
  providers: [SavedSearchesService],
  controllers: [SavedSearchesController],
})
export class SavedSearchesModule {}
