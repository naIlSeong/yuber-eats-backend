import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import { User } from 'src/users/entities/user.entity';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import {
  AllRestaurantsInput,
  AllRestaurantsOutput,
} from './dtos/all-restaurants.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import {
  RestaurantDetailInput,
  RestaurantDetailOutput,
} from './dtos/restaurant-detail.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dtos/search-restaurant.dto';
import { Category } from './entities/category.entity';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurant.service';

@Resolver(of => Restaurant)
export class RestaurantResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Mutation(returns => CreateRestaurantOutput)
  @Role(['Owner'])
  async createRestaurant(
    @Args('input') createRestaurantInput: CreateRestaurantInput,
    @AuthUser() authUser: User,
  ) {
    return this.restaurantService.createRestaurant(
      authUser,
      createRestaurantInput,
    );
  }

  @Mutation(returns => EditRestaurantOutput)
  @Role(['Owner'])
  async editRestaurant(
    @Args('input') editRestaurantInput: EditRestaurantInput,
    @AuthUser() owner: User,
  ): Promise<EditRestaurantOutput> {
    return this.restaurantService.editRestaurant(owner, editRestaurantInput);
  }

  @Mutation(returns => DeleteRestaurantOutput)
  @Role(['Owner'])
  async deleteRestaurant(
    @Args('input') deleteRestaurantInput: DeleteRestaurantInput,
    @AuthUser() owner: User,
  ): Promise<DeleteRestaurantOutput> {
    return this.restaurantService.deleteRestaurant(
      owner,
      deleteRestaurantInput,
    );
  }

  @Query(returns => AllRestaurantsOutput)
  async allRestaurants(
    @Args('input') allRestaurantsInput: AllRestaurantsInput,
  ): Promise<AllRestaurantsOutput> {
    return this.restaurantService.allRestaurants(allRestaurantsInput);
  }

  @Query(returns => RestaurantDetailOutput)
  async restaurantDetail(
    @Args('input') restaurantDetailInput: RestaurantDetailInput,
  ): Promise<RestaurantDetailOutput> {
    return this.restaurantService.restaurantDetail(restaurantDetailInput);
  }

  @Query(returns => SearchRestaurantOutput)
  async searchRestaurant(
    @Args('input') searchRestaurantInput: SearchRestaurantInput,
  ): Promise<SearchRestaurantOutput> {
    return this.restaurantService.searchRestaurant(searchRestaurantInput);
  }
}

@Resolver(of => Category)
export class CategoryResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @ResolveField(returns => Int)
  restaurantCount(@Parent() category: Category): Promise<number> {
    return this.restaurantService.countRestaurant(category);
  }

  @Query(returns => AllCategoriesOutput)
  async allCategories(): Promise<AllCategoriesOutput> {
    return this.restaurantService.allCategories();
  }

  @Query(returns => CategoryOutput)
  async findCategoryBySlug(
    @Args('input') categoryInput: CategoryInput,
  ): Promise<CategoryOutput> {
    return this.restaurantService.findCategoryBySlug(categoryInput);
  }
}
