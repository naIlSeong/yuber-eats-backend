import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Category } from '../entities/category.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { PaginationInput, PaginationOutput } from './pagination.dto';

@InputType()
export class CategoryInput extends PaginationInput {
  @Field(type => String)
  slug: string;
}

@ObjectType()
export class CategoryOutput extends PaginationOutput {
  @Field(type => Category, { nullable: true })
  category?: Category;

  @Field(type => [Restaurant], { nullable: true })
  restaurants?: Restaurant[];
}
