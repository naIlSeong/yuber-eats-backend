import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { getConnection } from 'typeorm';
import * as request from 'supertest';

const GRAPHQL_ENDPOINT = '/graphql';

const testOwner = {
  email: 'owner@test.com',
  password: '12341234',
};

const testRestaurant = {
  name: 'Any Name',
  address: 'Any Address',
  coverImg: 'Any URL',
  categoryName: 'Any Category',
};

describe('RestaurantModule (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest()
      .set('x-jwt', jwtToken)
      .send({ query });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await getConnection().dropDatabase();
    app.close();
  });

  describe('create account and login', () => {
    it('should create account', () => {
      return publicTest(`
            mutation {
                createAccount(input: {
                  email: "${testOwner.email}"
                  password: "${testOwner.password}"
                  role: Owner
                }) {
                  ok
                  error
                }
              }
            `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                createAccount: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    it('should login and create token', () => {
      return publicTest(`
        mutation {
            login(input: {
              email: "${testOwner.email}"
              password: "${testOwner.password}"
            }) {
              ok
              error
              token
            }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                login: { ok, error, token },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(token).toEqual(expect.any(String));
          jwtToken = token;
        });
    });
  });

  describe('createRestaurant', () => {
    it('should create restaurant', () => {
      return privateTest(`
        mutation {
            createRestaurant(input: {
              name: ${testRestaurant.name}
              address: ${testRestaurant.address}
              coverImg: ${testRestaurant.coverImg}
              categoryName: ${testRestaurant.categoryName}
            }) {
              ok
              error
            }
          }`)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                createRestaurant: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });
  });

  it.todo('editRestaurant');
  it.todo('deleteRestaurant');
  it.todo('allRestaurants');
  it.todo('restaurantDetail');
  it.todo('searchRestaurant');
});
