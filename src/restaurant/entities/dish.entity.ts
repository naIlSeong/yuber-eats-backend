import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@InputType('DishInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Dish extends CoreEntity {
  @Column()
  @Field(type => String)
  @IsString()
  name: string;

  @Column()
  @Field(type => Number)
  @IsNumber()
  price: number;

  @Column()
  @Field(type => String)
  @IsString()
  photo: string;

  @Column()
  @Field(type => String)
  @IsString()
  @Length(4, 144)
  description: string;

  @ManyToOne(
    type => Restaurant,
    restaurant => restaurant.menu,
    { onDelete: 'CASCADE' },
  )
  @Field(type => Restaurant)
  restaurant: Restaurant;

  @RelationId((dish: Dish) => dish.restaurant)
  restaurantId: number;
}
