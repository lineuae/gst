import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ username: username.toLowerCase() })
      .exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async createUser(
    username: string,
    password: string,
    role: UserRole = UserRole.Admin,
  ): Promise<UserDocument> {
    const existing = await this.findByUsername(username);
    if (existing) {
      throw new BadRequestException('Username already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = new this.userModel({
      username: username.toLowerCase(),
      passwordHash,
      role,
    });
    return created.save();
  }

  async listUsers(): Promise<{ id: string; username: string; role: UserRole }[]> {
    const users = await this.userModel
      .find({}, { username: 1, role: 1 })
      .sort({ createdAt: 1 })
      .exec();
    return users.map((u) => ({
      id: u._id.toString(),
      username: u.username,
      role: u.role,
    }));
  }
}
