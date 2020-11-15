import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { Category } from './category.entity';

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

  @ManyToOne(
    type => Category,
    category => category.restaurants,
    { onDelete: 'SET NULL' },
  )
  @Field(type => Category, { nullable: true })
  category?: Category;

  @ManyToOne(
    type => User,
    user => user.restaurants,
    { onDelete: 'CASCADE' },
  )
  @Field(type => User)
  owner: User;

  @RelationId((restaurant: Restaurant) => restaurant.owner)
  ownerId: number;
}
