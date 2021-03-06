import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Raw, Repository } from 'typeorm';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import {
  AllRestaurantsInput,
  AllRestaurantsOutput,
} from './dtos/all-restaurants.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
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
import { Dish } from './entities/dish.entity';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryRepository } from './repository/category.repository';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,
    private readonly categoryRepo: CategoryRepository,
    @InjectRepository(Dish) private readonly dishRepo: Repository<Dish>,
  ) {}

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurantRepo.create(createRestaurantInput);
      newRestaurant.owner = owner;
      const category = await this.categoryRepo.getOrCreate(
        createRestaurantInput.categoryName,
      );
      newRestaurant.category = category;
      await this.restaurantRepo.save(newRestaurant);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: 'Unexpected error',
      };
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      const restaurant = await this.restaurantRepo.findOne(
        editRestaurantInput.restaurantId,
      );
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }
      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: 'You are not owner of this restaurant',
        };
      }

      let category: Category = null;
      if (editRestaurantInput.categoryName) {
        category = await this.categoryRepo.getOrCreate(
          editRestaurantInput.categoryName,
        );
        restaurant.category = category;
      }

      await this.restaurantRepo.save([
        {
          id: editRestaurantInput.restaurantId,
          ...editRestaurantInput,
          ...(category && { category }),
        },
      ]);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: 'Unexpected error',
      };
    }
  }

  async deleteRestaurant(
    owner: User,
    { restaurantId }: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const restaurant = await this.restaurantRepo.findOne(restaurantId);
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }
      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: 'You are not owner of this restaurant',
        };
      }
      await this.restaurantRepo.delete(restaurantId);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: 'Unexpected error',
      };
    }
  }

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categoryRepo.find();
      return { ok: true, categories };
    } catch (error) {
      return {
        ok: false,
        error: 'Unexpected error',
      };
    }
  }

  async countRestaurant(category: Category): Promise<number> {
    return this.restaurantRepo.count({ category });
  }

  async findCategoryBySlug({
    slug,
    page,
  }: CategoryInput): Promise<CategoryOutput> {
    try {
      const category = await this.categoryRepo.findOne({ slug });
      if (!category) {
        return {
          ok: false,
          error: 'Category not found',
        };
      }
      const restaurants = await this.restaurantRepo.find({
        where: { category },
        take: 25,
        skip: (page - 1) * 25,
        order: {
          isPromoted: 'DESC',
        },
      });
      const totalResults = await this.countRestaurant(category);
      return {
        ok: true,
        category,
        restaurants,
        totalResults,
        totalPages: Math.ceil(totalResults / 25),
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Unexpected error',
      };
    }
  }

  async allRestaurants({
    page,
  }: AllRestaurantsInput): Promise<AllRestaurantsOutput> {
    try {
      const [
        restaurants,
        totalResults,
      ] = await this.restaurantRepo.findAndCount({
        take: 25,
        skip: (page - 1) * 25,
        order: {
          isPromoted: 'DESC',
        },
      });
      return {
        ok: true,
        restaurants,
        totalResults,
        totalPages: Math.ceil(totalResults / 25),
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Unexpected error',
      };
    }
  }

  async restaurantDetail({
    restaurantId,
  }: RestaurantDetailInput): Promise<RestaurantDetailOutput> {
    try {
      const restaurant = await this.restaurantRepo.findOne(restaurantId, {
        relations: ['menu', 'category', 'owner'],
      });
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }
      return {
        ok: true,
        restaurant,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Unexpected error',
      };
    }
  }

  async searchRestaurant({
    query,
    page,
  }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    try {
      const [
        restaurants,
        totalResults,
      ] = await this.restaurantRepo.findAndCount({
        where: { name: Raw(name => `${name} ILIKE '%${query}%'`) },
        take: 25,
        skip: (page - 1) * 25,
      });
      if (!restaurants) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }
      return {
        ok: true,
        restaurants,
        totalResults,
        totalPages: Math.ceil(totalResults / 25),
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Unexpected error',
      };
    }
  }

  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try {
      const restaurant = await this.restaurantRepo.findOne(
        createDishInput.restaurantId,
      );
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }
      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: 'You are not owner of this restaurant',
        };
      }
      await this.dishRepo.save(
        this.dishRepo.create({ ...createDishInput, restaurant }),
      );
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: 'Unexpected error',
      };
    }
  }

  async deleteDish(
    owner: User,
    { dishId }: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      const dish = await this.dishRepo.findOne(dishId, {
        relations: ['restaurant'],
      });
      if (!dish) {
        return {
          ok: false,
          error: 'Dish not found',
        };
      }
      if (dish.restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: 'You are not owner of this restaurant',
        };
      }
      await this.dishRepo.delete(dishId);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: 'Unexpected error',
      };
    }
  }

  async editDish(
    owner: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      const dish = await this.dishRepo.findOne(editDishInput.dishId, {
        relations: ['restaurant'],
      });
      if (!dish) {
        return {
          ok: false,
          error: 'Dish not found',
        };
      }
      if (dish.restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: 'You are not owner of this restaurant',
        };
      }
      await this.dishRepo.save([
        {
          id: editDishInput.dishId,
          ...editDishInput,
        },
      ]);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: 'Unexpected error',
      };
    }
  }
}
