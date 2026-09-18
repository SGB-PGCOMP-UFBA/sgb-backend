import { Module } from '@nestjs/common'
import { AllocationService } from './allocation.service'
import { AllocationController } from './allocation.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Allocation } from '@/allocation/entities/allocation.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Allocation])],
  controllers: [AllocationController],
  providers: [AllocationService],
  exports: [AllocationService]
})
export class AllocationModule {}
