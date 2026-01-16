import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        workingDays: true,
        workStartTime: true,
        workEndTime: true,
        dailyTargetMinutes: true,
        slackUserId: true,
        reminderChannel: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash: hashedPassword,
        name: createUserDto.name,
        role: createUserDto.role || 'collaborator',
        workingDays: createUserDto.workingDays || [1, 2, 3, 4, 5],
        workStartTime: createUserDto.workStartTime || '09:00',
        workEndTime: createUserDto.workEndTime || '18:00',
        dailyTargetMinutes: createUserDto.dailyTargetMinutes || 480,
        slackUserId: createUserDto.slackUserId,
        reminderChannel: createUserDto.reminderChannel || 'slack_only',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        workingDays: true,
        workStartTime: true,
        workEndTime: true,
        dailyTargetMinutes: true,
        slackUserId: true,
        reminderChannel: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const data: any = { ...updateUserDto };

    if (updateUserDto.password) {
      data.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
      delete data.password;
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        workingDays: true,
        workStartTime: true,
        workEndTime: true,
        dailyTargetMinutes: true,
        slackUserId: true,
        reminderChannel: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
