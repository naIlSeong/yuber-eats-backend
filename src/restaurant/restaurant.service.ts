import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
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
import { Category } from './entities/category.entity';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryRepository } from './repository/category.repository';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,
    private readonly categoryRepo: CategoryRepository,
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
      return { ok: false, error: "Couldn't create restaurant" };
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

  async findCategoryBySlug({ slug }: CategoryInput): Promise<CategoryOutput> {
    try {
      const category = await this.categoryRepo.findOne(
        { slug },
        { relations: ['restaurants'] },
      );
      if (!category) {
        return {
          ok: false,
          error: 'Category not found',
        };
      }
      return {
        ok: true,
        category,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Unexpected error',
      };
    }
  }
}
