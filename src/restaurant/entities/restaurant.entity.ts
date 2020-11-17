import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Order } from 'src/order/entities/order.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { Category } from './category.entity';
import { Dish } from './dish.entity';

@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {
  @Column()
  @Field(type => String)
  @IsString()
  @Length(5)
  name: string;

  @Column()
  @Field(type => String)
  @IsString()
  coverImg: string;

  @Column()
  @Field(type => String)
  @IsString()
  address: string;

  @Field(type => Category, { nullable: true })
  @ManyToOne(
    type => Category,
    category => category.restaurants,
    { onDelete: 'SET NULL' },
  )
  category?: Category;

  @Field(type => User)
  @ManyToOne(
    type => User,
    user => user.restaurants,
    { onDelete: 'CASCADE' },
  )
  owner: User;

  @RelationId((restaurant: Restaurant) => restaurant.owner)
  ownerId: number;

  @Field(type => [Dish])
  @OneToMany(
    type => Dish,
    dish => dish.restaurant,
  )
  menu: Dish[];

  @Field(type => [Order])
  @OneToMany(
    type => Order,
    order => order.restaurant,
  )
  orders: Order[];
}
