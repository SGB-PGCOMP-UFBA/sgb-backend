import { Module } from '@nestjs/common';
import { AllocationService } from './service/allocation.service';
import { AllocationController } from './controller/allocation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Allocation } from './entities/allocation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Allocation])],
  controllers: [AllocationController],
  providers: [AllocationService]
})
export class AllocationModule {}
