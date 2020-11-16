import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Restaurant } from '../entities/restaurant.entity';
import {
  PaginationInput,
  PaginationOutput,
} from '../../common/dtos/pagination.dto';

@InputType()
export class AllRestaurantsInput extends PaginationInput {}

@ObjectType()
export class AllRestaurantsOutput extends PaginationOutput {
  @Field(type => [Restaurant], { nullable: true })
  results?: Restaurant[];
}
