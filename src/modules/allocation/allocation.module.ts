import { Module } from '@nestjs/common';
import { AllocationService } from './service/allocation.service';
import { AllocationController } from './controller/allocation.controller';

@Module({
  controllers: [AllocationController],
  providers: [AllocationService]
})
export class AllocationModule {}
