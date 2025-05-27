import { Injectable } from '@nestjs/common';
import { CreateAllocationDto } from '../dto/create-allocation.dto';
import { UpdateAllocationDto } from '../dto/update-allocation.dto';

@Injectable()
export class AllocationService {
  create(createAllocationDto: CreateAllocationDto) {
    return 'This action adds a new allocation';
  }

  findAll() {
    return `This action returns all allocation`;
  }

  findOne(id: number) {
    return `This action returns a #${id} allocation`;
  }

  update(id: number, updateAllocationDto: UpdateAllocationDto) {
    return `This action updates a #${id} allocation`;
  }

  remove(id: number) {
    return `This action removes a #${id} allocation`;
  }
}
