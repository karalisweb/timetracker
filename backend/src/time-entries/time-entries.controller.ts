import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TimeEntriesService } from './time-entries.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';

@Controller('time-entries')
@UseGuards(JwtAuthGuard)
export class TimeEntriesController {
  constructor(private timeEntriesService: TimeEntriesService) {}

  @Get()
  async findByDate(@Request() req: any, @Query('date') date: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.timeEntriesService.findByUserAndDate(req.user.sub, targetDate);
  }

  @Post()
  async create(@Request() req: any, @Body() createDto: CreateTimeEntryDto) {
    return this.timeEntriesService.create(req.user.sub, createDto);
  }

  @Put(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateTimeEntryDto,
  ) {
    return this.timeEntriesService.update(req.user.sub, id, updateDto);
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    await this.timeEntriesService.delete(req.user.sub, id);
    return { message: 'Time entry eliminata' };
  }
}
