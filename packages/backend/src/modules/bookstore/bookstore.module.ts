import { Module } from '@nestjs/common';
import { BookstoreController } from './bookstore.controller';
import { BookstoreService } from './bookstore.service';

@Module({
  controllers: [BookstoreController],
  providers: [BookstoreService],
})
export class BookstoreModule {}
