import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OtelLoggerService } from '@supreme-int/nestjs-shared';
import { Repository } from 'typeorm';
import { UserEntity } from './User.entity';

export type UserRole = 'user' | 'moderator' | 'admin';

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly logger: OtelLoggerService,
  ) {}

  async findByEmail(email: string): Promise<User | undefined> {
    this.logger.debug(`Finding user by email: ${email}`, 'UsersService');
    const user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      this.logger.debug(`User found: ${user.id}`, 'UsersService');
    } else {
      this.logger.debug(`User not found for email: ${email}`, 'UsersService');
    }
    return user ?? undefined;
  }

  async findById(id: number): Promise<User | undefined> {
    this.logger.debug(`Finding user by id: ${id}`, 'UsersService');
    const user = await this.userRepository.findOne({ where: { id } });
    return user ?? undefined;
  }

  async create(email: string, hashedPassword: string, name: string, role: UserRole = 'user'): Promise<User> {
    this.logger.log(`Creating new user: ${email} with role: ${role}`, 'UsersService');
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      role,
    });
    const savedUser = await this.userRepository.save(user);
    this.logger.log(`User created successfully: ${savedUser.id}`, 'UsersService');
    return savedUser;
  }

  async update(id: number, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      return undefined;
    }
    Object.assign(user, updates);
    return await this.userRepository.save(user);
  }

  async delete(id: number): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      return false;
    }
    await this.userRepository.remove(user);
    return true;
  }
}
