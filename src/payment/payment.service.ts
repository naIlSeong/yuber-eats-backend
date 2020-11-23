import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurant/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import {
  CreatePaymentInput,
  CreatePaymentOuput,
} from './dtos/create-payment.dto';
import { GetPaymentOutput } from './dtos/get-payment.dto';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,
  ) {}

  async createPayment(
    { transactionId, restaurantId }: CreatePaymentInput,
    owner: User,
  ): Promise<CreatePaymentOuput> {
    try {
      const restaurant = await this.restaurantRepo.findOne(restaurantId);
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }
      if (restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: 'Forbidden',
        };
      }

      await this.paymentRepo.save(
        this.paymentRepo.create({ transactionId, user: owner, restaurant }),
      );
      const date = new Date();
      date.setDate(date.getDate() + 7);
      restaurant.isPromoted = true;
      restaurant.promotedUntil = date;
      this.restaurantRepo.save(restaurant);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: 'Unexpected error',
      };
    }
  }

  async getPayment(owner: User): Promise<GetPaymentOutput> {
    try {
      const payments = await this.paymentRepo.find({ user: owner });
      return {
        ok: true,
        payments,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Unexpected error',
      };
    }
  }
}
