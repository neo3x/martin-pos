import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

// Core modules
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BranchesModule } from './modules/branches/branches.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { SalesModule } from './modules/sales/sales.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CustomersModule } from './modules/customers/customers.module';
import { CashRegisterModule } from './modules/cash-register/cash-register.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AIModule } from './modules/ai/ai.module';

// Module-specific
import { RestaurantModule } from './modules/restaurant/restaurant.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // Core modules
    DatabaseModule,
    AuthModule,
    UsersModule,
    BranchesModule,
    ProductsModule,
    CategoriesModule,
    SalesModule,
    InventoryModule,
    CustomersModule,
    CashRegisterModule,
    ReportsModule,
    AIModule,

    // Module-specific
    RestaurantModule,
  ],
})
export class AppModule {}
