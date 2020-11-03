import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UserModule (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.todo('it.todo(createAccount)');
  it.todo('it.todo(userProfile)');
  it.todo('it.todo(login)');
  it.todo('it.todo(me)');
  it.todo('it.todo(verifyEmail)');
  it.todo('it.todo(editProfile)');
});
