import {
  Field,
  InputType,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Dish } from '../entities/dish.entity';

@InputType()
export class EditDishInput extends PickType(PartialType(Dish), [
  'name',
  'description',
  'options',
  'photo',
  'price',
]) {
  @Field(type => Number)
  dishId: number;
}

@ObjectType()
export class EditDishOutput extends CoreOutput {}
