import { Injectable, UnauthorizedException, ConflictException, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { UsersService } from '../users/users.service';
import { IAuthResponse, ModuleType, UserRole } from '@martin-pos/shared';
import { RegisterDto } from './dto/register.dto';

type ModuleBlueprintCategory = {
  name: string;
  description: string;
  icon: string;
  color: string;
};

type ModuleBlueprintProduct = {
  categoryName: string;
  sku: string;
  barcode?: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  unit?: string;
  expirationDays?: number;
};

type ModuleBlueprintCustomer = {
  name: string;
  email: string;
  phone: string;
  address: string;
  loyaltyPoints?: number;
  totalPurchases?: number;
};

type ModuleBlueprint = {
  categories: ModuleBlueprintCategory[];
  products: ModuleBlueprintProduct[];
  customers: ModuleBlueprintCustomer[];
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any): Promise<IAuthResponse> {
    const branch = user.branchId
      ? await this.prisma.branch.findUnique({
          where: { id: user.branchId },
          select: { moduleType: true, name: true },
        })
      : null;

    const activeModule = branch?.moduleType || ModuleType.ALL;
    const availableModules =
      activeModule === ModuleType.ALL
        ? [ModuleType.ALL, ModuleType.RESTAURANT, ModuleType.MINIMARKET, ModuleType.BOTILLERIA, ModuleType.BOOKSTORE]
        : [activeModule];
    const enrichedUser = {
      ...user,
      moduleType: activeModule,
      branchName: branch?.name || null,
      availableModules,
      isDemo: String(user.email || '').includes('@demo.martinpos.local'),
    };

    const payload = {
      sub: enrichedUser.id,
      email: enrichedUser.email,
      role: enrichedUser.role,
      branchId: enrichedUser.branchId,
      moduleType: enrichedUser.moduleType,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    return {
      user: enrichedUser,
      accessToken,
      refreshToken,
    };
  }

  async register(registerDto: RegisterDto): Promise<IAuthResponse> {
    const existing = await this.usersService.findByEmail(registerDto.email);
    if (existing) {
      throw new ConflictException('El email ya esta registrado');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const moduleType = registerDto.moduleType || ModuleType.MINIMARKET;

    const branch = await this.prisma.branch.create({
      data: {
        name: registerDto.businessName,
        address: registerDto.businessAddress,
        phone: registerDto.businessPhone,
        email: registerDto.businessEmail || registerDto.email,
        moduleType,
        config: {
          currency: 'CLP',
          timezone: 'America/Santiago',
          taxRate: 0.19,
          initializedAt: new Date().toISOString(),
          moduleType,
        },
      },
    });

    const user = await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phoneNumber: registerDto.phoneNumber,
      branchId: branch.id,
      role: UserRole.SUPER_ADMIN,
    });

    if (registerDto.initializeDemoData !== false) {
      await this.bootstrapModuleData(branch.id, user.id, moduleType);
    }

    this.logger.log(`User registered: ${user.email} (${moduleType})`);

    const { password: _, ...userWithoutPassword } = user;
    return this.login(userWithoutPassword);
  }

  async demoAccess(moduleType: ModuleType): Promise<IAuthResponse> {
    const safeModule = moduleType || ModuleType.MINIMARKET;
    const moduleSlug = safeModule.toLowerCase();
    const demoEmail = `demo.${moduleSlug}@demo.martinpos.local`;
    const demoPassword = 'demo123';
    const hashedPassword = await bcrypt.hash(demoPassword, 10);

    let branch = await this.prisma.branch.findFirst({
      where: {
        email: `demo.${moduleSlug}@martinpos.local`,
      },
    });

    if (!branch) {
      branch = await this.prisma.branch.create({
        data: {
          name: `Demo ${this.moduleLabel(safeModule)}`,
          address: 'Demo Street 123',
          phone: '+56911111111',
          email: `demo.${moduleSlug}@martinpos.local`,
          moduleType: safeModule,
          config: {
            currency: 'CLP',
            timezone: 'America/Santiago',
            taxRate: 0.19,
            isDemo: true,
            moduleType: safeModule,
          },
        },
      });
    }

    let user = await this.usersService.findByEmail(demoEmail);
    if (!user) {
      user = await this.usersService.create({
        email: demoEmail,
        password: hashedPassword,
        firstName: 'Demo',
        lastName: this.moduleLabel(safeModule),
        role: UserRole.ADMIN,
        phoneNumber: '+56900000000',
        branchId: branch.id,
      });
    }

    await this.bootstrapModuleData(branch.id, user.id, safeModule);

    const { password: _, ...userWithoutPassword } = user;
    return this.login(userWithoutPassword);
  }

  async refreshToken(userId: string): Promise<{ accessToken: string }> {
    const user = await this.usersService.findOne(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario invalido');
    }

    const branch = user.branchId
      ? await this.prisma.branch.findUnique({
          where: { id: user.branchId },
          select: { moduleType: true },
        })
      : null;

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      moduleType: branch?.moduleType || ModuleType.ALL,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async bootstrapBranchData(userId: string, branchId?: string) {
    if (!branchId) {
      throw new BadRequestException('El usuario no tiene sucursal asociada');
    }

    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, moduleType: true, name: true },
    });

    if (!branch) {
      throw new NotFoundException('Sucursal no encontrada');
    }

    const moduleType = branch.moduleType as unknown as ModuleType;
    await this.bootstrapModuleData(branch.id, userId, moduleType);

    return {
      message: 'Datos base cargados correctamente',
      branchId: branch.id,
      branchName: branch.name,
      moduleType,
    };
  }

  private moduleLabel(moduleType: ModuleType): string {
    const labels: Record<ModuleType, string> = {
      [ModuleType.RESTAURANT]: 'Restaurante',
      [ModuleType.MINIMARKET]: 'Minimarket',
      [ModuleType.BOTILLERIA]: 'Botilleria',
      [ModuleType.BOOKSTORE]: 'Libreria / Bazar',
      [ModuleType.ALL]: 'Multimodulo',
    };
    return labels[moduleType] || 'Comercio';
  }

  private async bootstrapModuleData(branchId: string, userId: string, moduleType: ModuleType): Promise<void> {
    const blueprint = this.getModuleBlueprint(moduleType);
    const categoryIds = new Map<string, string>();

    for (const category of blueprint.categories) {
      const existing = await this.prisma.category.findFirst({
        where: { branchId, name: category.name, deletedAt: null },
      });
      const saved = existing
        ? await this.prisma.category.update({
            where: { id: existing.id },
            data: { description: category.description, icon: category.icon, color: category.color },
          })
        : await this.prisma.category.create({
            data: {
              branchId,
              name: category.name,
              description: category.description,
              icon: category.icon,
              color: category.color,
            },
          });
      categoryIds.set(category.name, saved.id);
    }

    const createdProducts: any[] = [];
    for (const product of blueprint.products) {
      const expirationDate = product.expirationDays
        ? new Date(Date.now() + product.expirationDays * 24 * 60 * 60 * 1000)
        : null;

      const payload: any = {
        name: product.name,
        description: product.description,
        price: product.price,
        costPrice: product.costPrice,
        stock: product.stock,
        minStock: product.minStock,
        unit: product.unit || 'UN',
        status: 'ACTIVE',
        isPerishable: !!product.expirationDays,
        expirationDate,
        taxable: true,
        taxRate: 0.19,
        branchId,
        categoryId: categoryIds.get(product.categoryName),
      };

      const existing = await this.prisma.product.findUnique({ where: { sku: product.sku } });
      const saved = existing
        ? await this.prisma.product.update({ where: { sku: product.sku }, data: payload })
        : await this.prisma.product.create({
            data: {
              sku: product.sku,
              barcode: product.barcode,
              ...payload,
            },
          });
      createdProducts.push(saved);
    }

    for (const customer of blueprint.customers) {
      const existing = await this.prisma.customer.findFirst({
        where: { branchId, email: customer.email, deletedAt: null },
      });
      if (!existing) {
        await this.prisma.customer.create({
          data: {
            branchId,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            loyaltyPoints: customer.loyaltyPoints || 0,
            totalPurchases: customer.totalPurchases || 0,
          },
        });
      }
    }

    const existingSalesCount = await this.prisma.sale.count({ where: { branchId } });
    if (existingSalesCount < 10 && createdProducts.length >= 4) {
      for (let i = 0; i < 12; i += 1) {
        const date = new Date();
        date.setDate(date.getDate() - (i % 6));
        date.setHours(10 + (i % 8), 10, 0, 0);

        const saleNumber = `${moduleType.substring(0, 3)}-${date
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, '')}-${String(i + 1).padStart(3, '0')}`;
        const existing = await this.prisma.sale.findFirst({ where: { saleNumber, branchId } });
        if (existing) continue;

        const p1 = createdProducts[i % createdProducts.length];
        const p2 = createdProducts[(i + 3) % createdProducts.length];
        const q1 = 1 + (i % 2);
        const q2 = 1 + ((i + 1) % 3);
        const subtotal = q1 * Number(p1.price) + q2 * Number(p2.price);
        const tax = Math.round(subtotal * 0.19);
        const total = subtotal + tax;

        const sale = await this.prisma.sale.create({
          data: {
            saleNumber,
            status: 'COMPLETED',
            subtotal,
            tax,
            discount: 0,
            total,
            paymentMethod: ['CASH', 'CARD', 'TRANSFER', 'QR'][i % 4] as any,
            branchId,
            userId,
            createdAt: date,
            updatedAt: date,
            items: {
              create: [
                {
                  productId: p1.id,
                  quantity: q1,
                  unitPrice: p1.price,
                  subtotal: q1 * Number(p1.price),
                  tax: Math.round(q1 * Number(p1.price) * 0.19),
                  discount: 0,
                  total: Math.round(q1 * Number(p1.price) * 1.19),
                },
                {
                  productId: p2.id,
                  quantity: q2,
                  unitPrice: p2.price,
                  subtotal: q2 * Number(p2.price),
                  tax: Math.round(q2 * Number(p2.price) * 0.19),
                  discount: 0,
                  total: Math.round(q2 * Number(p2.price) * 1.19),
                },
              ],
            },
          },
          include: { items: true },
        });

        for (const item of sale.items) {
          const product = createdProducts.find((p) => p.id === item.productId);
          if (!product) continue;
          const prev = Number(product.stock);
          const next = Math.max(0, prev - Number(item.quantity));

          await this.prisma.stockMovement.create({
            data: {
              type: 'SALE',
              quantity: item.quantity,
              previousStock: prev,
              newStock: next,
              reason: 'Carga demo inicial',
              referenceId: sale.id,
              inputMethod: 'MANUAL',
              productId: product.id,
              branchId,
              userId,
              createdAt: sale.createdAt,
              updatedAt: sale.createdAt,
            },
          });

          await this.prisma.product.update({
            where: { id: product.id },
            data: {
              stock: next,
              status: next === 0 ? 'OUT_OF_STOCK' : 'ACTIVE',
            },
          });
          product.stock = next as any;
        }
      }
    }

    const lowStockProducts = await this.prisma.product.findMany({
      where: { branchId, status: 'ACTIVE', deletedAt: null },
    });
    for (const p of lowStockProducts.filter((x) => Number(x.stock) <= Number(x.minStock))) {
      const alert = await this.prisma.inventoryAlert.findFirst({
        where: { branchId, productId: p.id, type: 'LOW_STOCK', isRead: false },
      });
      if (!alert) {
        await this.prisma.inventoryAlert.create({
          data: {
            branchId,
            productId: p.id,
            type: 'LOW_STOCK',
            message: `Stock bajo para ${p.name}`,
            priority: 'HIGH',
            isRead: false,
          },
        });
      }
    }

    if (moduleType === ModuleType.RESTAURANT) {
      const tables: any[] = [];
      for (let i = 1; i <= 10; i += 1) {
        const tableNumber = String(i);
        const existing = await this.prisma.table.findFirst({
          where: { branchId, number: tableNumber, deletedAt: null },
        });
        const table = existing
          ? existing
          : await this.prisma.table.create({
              data: {
                branchId,
                number: tableNumber,
                capacity: 2 + (i % 4),
                status: i % 3 === 0 ? 'OCCUPIED' : 'AVAILABLE',
              },
            });
        tables.push(table);
      }

      for (let i = 0; i < 4; i += 1) {
        const orderNumber = `ORD-DEMO-${String(i + 1).padStart(3, '0')}`;
        const exists = await this.prisma.order.findFirst({ where: { branchId, orderNumber } });
        if (exists) continue;
        const product = createdProducts[i % createdProducts.length];
        const table = tables[i % tables.length];
        await this.prisma.order.create({
          data: {
            orderNumber,
            branchId,
            tableId: table.id,
            waiterId: userId,
            status: ['PENDING', 'PREPARING', 'READY'][i % 3] as any,
            items: {
              create: [
                {
                  productId: product.id,
                  quantity: 1 + (i % 2),
                  status: 'PENDING',
                },
              ],
            },
          },
        });
      }
    }
  }

  private getModuleBlueprint(moduleType: ModuleType): ModuleBlueprint {
    const commonCustomers = [
      {
        name: 'Maria Lopez',
        email: `maria.${moduleType.toLowerCase()}@demo.local`,
        phone: '+56990111222',
        address: 'Centro 123',
        loyaltyPoints: 120,
        totalPurchases: 95000,
      },
      {
        name: 'Jorge Diaz',
        email: `jorge.${moduleType.toLowerCase()}@demo.local`,
        phone: '+56990111333',
        address: 'Norte 55',
        loyaltyPoints: 80,
        totalPurchases: 68000,
      },
      {
        name: 'Camila Soto',
        email: `camila.${moduleType.toLowerCase()}@demo.local`,
        phone: '+56990111444',
        address: 'Sur 98',
        loyaltyPoints: 40,
        totalPurchases: 43000,
      },
    ];

    if (moduleType === ModuleType.RESTAURANT) {
      return {
        categories: [
          { name: 'Entradas', description: 'Aperitivos', icon: 'UtensilsCrossed', color: '#f97316' },
          { name: 'Fondos', description: 'Platos principales', icon: 'ChefHat', color: '#ef4444' },
          { name: 'Postres', description: 'Dulces y cierre', icon: 'IceCream', color: '#ec4899' },
          { name: 'Bebidas', description: 'Bebidas y jugos', icon: 'CupSoda', color: '#3b82f6' },
        ],
        products: [
          {
            categoryName: 'Entradas',
            sku: 'RES-ENT-001',
            name: 'Empanadas de queso',
            description: 'Porcion x3',
            price: 4990,
            costPrice: 2900,
            stock: 20,
            minStock: 8,
          },
          {
            categoryName: 'Entradas',
            sku: 'RES-ENT-002',
            name: 'Ceviche clasico',
            description: 'Pescado del dia',
            price: 7990,
            costPrice: 4700,
            stock: 12,
            minStock: 4,
          },
          {
            categoryName: 'Fondos',
            sku: 'RES-FON-001',
            name: 'Lomo vetado',
            description: 'Con pure rustico',
            price: 14990,
            costPrice: 8600,
            stock: 16,
            minStock: 6,
          },
          {
            categoryName: 'Fondos',
            sku: 'RES-FON-002',
            name: 'Pasta pesto',
            description: 'Con parmesano',
            price: 10990,
            costPrice: 5800,
            stock: 22,
            minStock: 8,
          },
          {
            categoryName: 'Postres',
            sku: 'RES-POS-001',
            name: 'Cheesecake frutos rojos',
            description: 'Porcion',
            price: 4990,
            costPrice: 2200,
            stock: 14,
            minStock: 5,
            expirationDays: 3,
          },
          {
            categoryName: 'Postres',
            sku: 'RES-POS-002',
            name: 'Tiramisu',
            description: 'Porcion',
            price: 4690,
            costPrice: 2100,
            stock: 11,
            minStock: 4,
            expirationDays: 2,
          },
          {
            categoryName: 'Bebidas',
            sku: 'RES-BEB-001',
            name: 'Limonada menta',
            description: '500 ml',
            price: 2990,
            costPrice: 1200,
            stock: 30,
            minStock: 10,
          },
          {
            categoryName: 'Bebidas',
            sku: 'RES-BEB-002',
            name: 'Jugo natural mango',
            description: '500 ml',
            price: 3290,
            costPrice: 1400,
            stock: 18,
            minStock: 6,
          },
        ],
        customers: commonCustomers,
      };
    }

    if (moduleType === ModuleType.BOTILLERIA) {
      return {
        categories: [
          { name: 'Vinos', description: 'Tintos y blancos', icon: 'Wine', color: '#7f1d1d' },
          { name: 'Cervezas', description: 'Lager y artesanales', icon: 'Beer', color: '#d97706' },
          { name: 'Destilados', description: 'Whisky, pisco, vodka', icon: 'FlaskConical', color: '#0f766e' },
          { name: 'Mixers', description: 'Energeticas y gaseosas', icon: 'GlassWater', color: '#2563eb' },
        ],
        products: [
          {
            categoryName: 'Vinos',
            sku: 'BOT-VIN-001',
            name: 'Vino tinto reserva',
            description: '750ml',
            price: 8990,
            costPrice: 5400,
            stock: 24,
            minStock: 8,
          },
          {
            categoryName: 'Vinos',
            sku: 'BOT-VIN-002',
            name: 'Vino blanco sauvignon',
            description: '750ml',
            price: 7990,
            costPrice: 5000,
            stock: 19,
            minStock: 6,
          },
          {
            categoryName: 'Cervezas',
            sku: 'BOT-CER-001',
            name: 'Cerveza lager 330ml',
            description: 'Unidad',
            price: 1690,
            costPrice: 900,
            stock: 60,
            minStock: 15,
          },
          {
            categoryName: 'Cervezas',
            sku: 'BOT-CER-002',
            name: 'Cerveza artesanal IPA',
            description: '500ml',
            price: 2490,
            costPrice: 1500,
            stock: 28,
            minStock: 10,
          },
          {
            categoryName: 'Destilados',
            sku: 'BOT-DES-001',
            name: 'Whisky blend',
            description: '700ml',
            price: 18990,
            costPrice: 12900,
            stock: 9,
            minStock: 5,
          },
          {
            categoryName: 'Destilados',
            sku: 'BOT-DES-002',
            name: 'Pisco reservado',
            description: '700ml',
            price: 9990,
            costPrice: 6500,
            stock: 12,
            minStock: 5,
          },
          {
            categoryName: 'Mixers',
            sku: 'BOT-MIX-001',
            name: 'Bebida energetica',
            description: '250ml',
            price: 1490,
            costPrice: 850,
            stock: 48,
            minStock: 12,
          },
          {
            categoryName: 'Mixers',
            sku: 'BOT-MIX-002',
            name: 'Tonica premium',
            description: '330ml',
            price: 1790,
            costPrice: 980,
            stock: 30,
            minStock: 10,
          },
        ],
        customers: commonCustomers,
      };
    }

    if (moduleType === ModuleType.BOOKSTORE) {
      return {
        categories: [
          { name: 'Libros', description: 'Lectura y estudio', icon: 'BookOpen', color: '#1d4ed8' },
          { name: 'Cuadernos', description: 'Escolares y universitarios', icon: 'NotebookPen', color: '#0f766e' },
          { name: 'Escritura', description: 'Lapices y marcadores', icon: 'PenLine', color: '#9333ea' },
          { name: 'Oficina', description: 'Papeleria y accesorios', icon: 'BriefcaseBusiness', color: '#be123c' },
        ],
        products: [
          {
            categoryName: 'Libros',
            sku: 'LIB-BOO-001',
            name: 'Novela clasica',
            description: 'Edicion tapa blanda',
            price: 12990,
            costPrice: 7800,
            stock: 14,
            minStock: 5,
          },
          {
            categoryName: 'Libros',
            sku: 'LIB-BOO-002',
            name: 'Libro infantil ilustrado',
            description: '32 paginas',
            price: 8990,
            costPrice: 4900,
            stock: 20,
            minStock: 6,
          },
          {
            categoryName: 'Cuadernos',
            sku: 'LIB-CUA-001',
            name: 'Cuaderno universitario',
            description: '100 hojas',
            price: 2490,
            costPrice: 1400,
            stock: 42,
            minStock: 15,
          },
          {
            categoryName: 'Cuadernos',
            sku: 'LIB-CUA-002',
            name: 'Croquera A4',
            description: '80 hojas',
            price: 4590,
            costPrice: 2600,
            stock: 16,
            minStock: 6,
          },
          {
            categoryName: 'Escritura',
            sku: 'LIB-ESC-001',
            name: 'Set marcadores x12',
            description: 'Punta fina',
            price: 5990,
            costPrice: 3300,
            stock: 18,
            minStock: 7,
          },
          {
            categoryName: 'Escritura',
            sku: 'LIB-ESC-002',
            name: 'Lapiz grafito HB x3',
            description: 'Pack escolar',
            price: 1290,
            costPrice: 650,
            stock: 80,
            minStock: 20,
          },
          {
            categoryName: 'Oficina',
            sku: 'LIB-OFI-001',
            name: 'Resma papel carta',
            description: '500 hojas',
            price: 6990,
            costPrice: 4300,
            stock: 10,
            minStock: 6,
          },
          {
            categoryName: 'Oficina',
            sku: 'LIB-OFI-002',
            name: 'Carpeta archivadora',
            description: 'Lomo ancho',
            price: 1990,
            costPrice: 1100,
            stock: 35,
            minStock: 12,
          },
        ],
        customers: commonCustomers,
      };
    }

    return {
      categories: [
        { name: 'Abarrotes', description: 'Despensa diaria', icon: 'Package', color: '#16a34a' },
        { name: 'Bebidas', description: 'Gaseosas y jugos', icon: 'CupSoda', color: '#2563eb' },
        { name: 'Snacks', description: 'Dulces y salados', icon: 'Candy', color: '#ea580c' },
        { name: 'Limpieza', description: 'Hogar y negocio', icon: 'Sparkles', color: '#7c3aed' },
      ],
      products: [
        {
          categoryName: 'Abarrotes',
          sku: 'MIN-ABA-001',
          name: 'Arroz 1kg',
          description: 'Grado 1',
          price: 1490,
          costPrice: 980,
          stock: 36,
          minStock: 10,
        },
        {
          categoryName: 'Abarrotes',
          sku: 'MIN-ABA-002',
          name: 'Fideos spaghetti',
          description: '400g',
          price: 990,
          costPrice: 620,
          stock: 44,
          minStock: 12,
        },
        {
          categoryName: 'Abarrotes',
          sku: 'MIN-ABA-003',
          name: 'Pan de molde',
          description: 'Grande',
          price: 2290,
          costPrice: 1400,
          stock: 8,
          minStock: 8,
          expirationDays: 3,
        },
        {
          categoryName: 'Bebidas',
          sku: 'MIN-BEB-001',
          name: 'Bebida cola 1.5L',
          description: 'Retornable',
          price: 1990,
          costPrice: 1290,
          stock: 20,
          minStock: 8,
        },
        {
          categoryName: 'Bebidas',
          sku: 'MIN-BEB-002',
          name: 'Jugo nectar 1L',
          description: 'Durazno',
          price: 1690,
          costPrice: 980,
          stock: 25,
          minStock: 8,
        },
        {
          categoryName: 'Snacks',
          sku: 'MIN-SNK-001',
          name: 'Papas fritas 140g',
          description: 'Sabor original',
          price: 1790,
          costPrice: 1090,
          stock: 24,
          minStock: 10,
        },
        {
          categoryName: 'Snacks',
          sku: 'MIN-SNK-002',
          name: 'Galletas rellenas',
          description: 'Pack',
          price: 1390,
          costPrice: 790,
          stock: 30,
          minStock: 10,
        },
        {
          categoryName: 'Limpieza',
          sku: 'MIN-LIM-001',
          name: 'Detergente 3L',
          description: 'Ropa',
          price: 5490,
          costPrice: 3900,
          stock: 12,
          minStock: 6,
        },
      ],
      customers: commonCustomers,
    };
  }
}

