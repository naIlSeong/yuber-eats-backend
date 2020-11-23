import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import { User } from 'src/users/entities/user.entity';
import {
  CreatePaymentInput,
  CreatePaymentOuput,
} from './dtos/create-payment.dto';
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
}
