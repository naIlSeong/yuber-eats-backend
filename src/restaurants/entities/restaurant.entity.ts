import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity()
export class Restaurant {
  @PrimaryGeneratedColumn()
  @Field(type => Number)
  id: number;

  @Column()
  @Field(type => String)
  name: string;

  @Column()
  @Field(type => Boolean)
  isVegan: boolean;

  @Column()
  @Field(type => String)
  address: string;

  @Column()
  @Field(type => String)
  ownersName: string;
}
