import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant {
  @PrimaryGeneratedColumn()
  @Field(type => Number)
  id: number;

  @Column()
  @Field(type => String)
  @IsString()
  @Length(5)
  name: string;

  @Column({ default: true })
  // @Field(type => Boolean, { defaultValue: true })
  @Field(type => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isVegan: boolean;

  @Column()
  @Field(type => String)
  @IsString()
  address: string;
}
