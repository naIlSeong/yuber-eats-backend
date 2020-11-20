import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import { User } from 'src/users/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { Order } from './entities/order.entity';
import { OrderService } from './order.service';

const pubsub = new PubSub();

@Resolver(of => Order)
export class OrderResolver {
  constructor(private readonly orderService: OrderService) {}

  @Mutation(returns => CreateOrderOutput)
  @Role(['Client'])
  async createOrder(
    @Args('input') createOrderInput: CreateOrderInput,
    @AuthUser() customer: User,
  ): Promise<CreateOrderOutput> {
    return this.orderService.createOrder(createOrderInput, customer);
  }

  @Query(returs => GetOrdersOutput)
  @Role(['Any'])
  async getOrders(
    @Args('input') getOrdersInput: GetOrdersInput,
    @AuthUser() user: User,
  ): Promise<GetOrdersOutput> {
    return this.orderService.getOrders(getOrdersInput, user);
  }

  @Query(returns => GetOrderOutput)
  @Role(['Any'])
  async getOrder(
    @Args('input') getOrderInput: GetOrderInput,
    @AuthUser() user: User,
  ): Promise<GetOrderOutput> {
    return this.orderService.getOrder(getOrderInput, user);
  }

  @Mutation(returns => EditOrderOutput)
  @Role(['Any'])
  async editOrder(
    @Args('input') editOrderInput: EditOrderInput,
    @AuthUser() user: User,
  ): Promise<EditOrderOutput> {
    return this.orderService.editOrder(editOrderInput, user);
  }

  @Subscription(returns => String)
  @Role(['Any'])
  orderSubscription(@AuthUser() user: User) {
    return pubsub.asyncIterator('helloFucker');
  }
}
