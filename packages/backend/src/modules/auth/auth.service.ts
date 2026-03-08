import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { IAuthResponse, UserRole } from '@martin-pos/shared';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any): Promise<IAuthResponse> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async register(registerDto: RegisterDto): Promise<IAuthResponse> {
    // Check if email already exists
    const existing = await this.usersService.findByEmail(registerDto.email);
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      role: UserRole.CASHIER,
    });

    this.logger.log(`User registered: ${user.email}`);

    const { password: _, ...userWithoutPassword } = user;

    return this.login(userWithoutPassword);
  }

  async refreshToken(userId: string): Promise<{ accessToken: string }> {
    const user = await this.usersService.findOne(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario inválido');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
