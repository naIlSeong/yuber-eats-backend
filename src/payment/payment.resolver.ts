import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import { User } from 'src/users/entities/user.entity';
import {
  CreatePaymentInput,
  CreatePaymentOuput,
} from './dtos/create-payment.dto';
import { GetPaymentOutput } from './dtos/get-payment.dto';
import { Payment } from './entities/payment.entity';
import { PaymentService } from './payment.service';

@Resolver(of => Payment)
export class PaymentResolver {
  constructor(private readonly paymentService: PaymentService) {}

  @Mutation(returns => CreatePaymentOuput)
  @Role(['Owner'])
  async createPayment(
    @Args('input') createPaymentInput: CreatePaymentInput,
    @AuthUser() owner: User,
  ): Promise<CreatePaymentOuput> {
    return this.paymentService.createPayment(createPaymentInput, owner);
  }

  @Query(returns => GetPaymentOutput)
  @Role(['Owner'])
  async getPayment(@AuthUser() owner: User): Promise<GetPaymentOutput> {
    return this.paymentService.getPayment(owner);
  }
}
