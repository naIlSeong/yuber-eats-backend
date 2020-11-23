import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { InternalServerErrorException } from '@nestjs/common';
import { IsEmail, IsEnum, Length } from 'class-validator';
import { Restaurant } from 'src/restaurant/entities/restaurant.entity';
import { Order } from 'src/order/entities/order.entity';
import { Payment } from 'src/payment/entities/payment.entity';

export enum UserRole {
  Client = 'Client',
  Owner = 'Owner',
  Delivery = 'Delivery',
}

registerEnumType(UserRole, { name: 'UserRole' });

@InputType('UserInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Column({ unique: true })
  @Field(type => String)
  @IsEmail()
  email: string;

  @Column({ select: false })
  @Field(type => String)
  @Length(8)
  password: string;

  @Column({ type: 'enum', enum: UserRole })
  @Field(type => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

  @Column({ default: false })
  @Field(type => Boolean)
  verified: boolean;

  @Field(type => [Restaurant])
  @OneToMany(
    type => Restaurant,
    restaurant => restaurant.owner,
  )
  restaurants: Restaurant[];

  @Field(type => [Order])
  @OneToMany(
    type => Order,
    order => order.customer,
  )
  orders: Order[];

  @Field(type => [Order])
  @OneToMany(
    type => Order,
    order => order.driver,
  )
  rides: Order[];

  @Field(type => [Payment])
  @OneToMany(
    type => Payment,
    payment => payment.user,
  )
  payments: Payment[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      try {
        this.password = await bcrypt.hash(this.password, 10);
      } catch (e) {
        console.log(e);
        throw new InternalServerErrorException();
      }
    }
  }

  async checkPassword(aPassword): Promise<boolean> {
    try {
      return bcrypt.compare(aPassword, this.password);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }
}
