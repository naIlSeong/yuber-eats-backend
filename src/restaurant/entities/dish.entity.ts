import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@InputType('DishOptionInputType', { isAbstract: true })
@ObjectType()
class DishOption {
  @Field(type => String)
  name: string;

  @Field(type => [String], { nullable: true })
  chice?: string[];

  @Field(type => Number, { nullable: true })
  extra?: number;
}

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

  @Column({ nullable: true })
  @Field(type => String, { nullable: true })
  @IsString()
  photo?: string;

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

  @Column({ type: 'json', nullable: true })
  @Field(type => [DishOption], { nullable: true })
  options?: DishOption[];
}
