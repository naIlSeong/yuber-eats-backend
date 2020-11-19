import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Dish } from 'src/restaurant/entities/dish.entity';
import { Restaurant } from 'src/restaurant/entities/restaurant.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,
    @InjectRepository(Dish)
    private readonly dishRepo: Repository<Dish>,
  ) {}

  async createOrder(
    { restaurantId, items }: CreateOrderInput,
    customer: User,
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurantRepo.findOne(restaurantId);
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }

      let orderTotalCost = 0;
      const orderItems: OrderItem[] = [];

      for (const item of items) {
        const dish = await this.dishRepo.findOne(item.dishId);
        if (!dish) {
          return {
            ok: false,
            error: 'Dish not found',
          };
        }
        let dishTotalCost = dish.price;
        for (const itemOption of item.options) {
          const dishOption = dish.options.find(
            dishOption => dishOption.name === itemOption.name,
          );
          if (dishOption) {
            if (dishOption.extra) {
              dishTotalCost = dishTotalCost + dishOption.extra;
            } else {
              const dishOptionChoice = dishOption.choice.find(
                optionChoice => optionChoice.name === itemOption.choice,
              );
              if (dishOptionChoice) {
                if (dishOptionChoice.extra) {
                  dishTotalCost = dishTotalCost + dishOptionChoice.extra;
                }
              }
            }
          }
        }
        orderTotalCost = orderTotalCost + dishTotalCost;
        const orderItem = await this.orderItemRepo.save(
          this.orderItemRepo.create({
            dish,
            options: item.options,
          }),
        );
        orderItems.push(orderItem);
      }

      await this.orderRepo.save(
        this.orderRepo.create({
          customer,
          restaurant,
          totalCost: orderTotalCost,
          items: orderItems,
        }),
      );
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: 'Unexpected error',
      };
    }
  }

  async getOrders(
    { status }: GetOrdersInput,
    user: User,
  ): Promise<GetOrdersOutput> {
    try {
      let orders: Order[];
      if (user.role === UserRole.Client) {
        orders = await this.orderRepo.find({
          where: {
            customer: user,
            ...(status && { status }),
          },
        });
      } else if (user.role === UserRole.Delivery) {
        orders = await this.orderRepo.find({
          where: {
            driver: user,
            ...(status && { status }),
          },
        });
      } else if (user.role === UserRole.Owner) {
        const restaurants = await this.restaurantRepo.find({
          where: {
            owner: user,
          },
          relations: ['orders'],
        });
        orders = restaurants.map(restaurant => restaurant.orders).flat(1);
        if (status) {
          orders = orders.filter(order => order.status === status);
        }
      }
      return {
        ok: true,
        orders,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Unexpected error',
      };
    }
  }
}
