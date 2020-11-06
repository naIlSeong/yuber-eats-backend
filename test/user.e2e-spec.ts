import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnection, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Verification } from 'src/users/entities/verification.entity';

jest.mock('got', () => {
  return {
    post: jest.fn(),
  };
});

const GRAPHQL_ENDPOINT = '/graphql';

const testUser = {
  email: 'na@ilseong.com',
  password: '1q2w3e4r',
};

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let verificationRepo: Repository<Verification>;
  let jwtToken: string;

  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest()
      .set('X-JWT', jwtToken)
      .send({ query });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    verificationRepo = module.get<Repository<Verification>>(
      getRepositoryToken(Verification),
    );
    await app.init();
  });

  afterAll(async () => {
    await getConnection().dropDatabase();
    app.close();
  });

  describe('createAccount', () => {
    it('should create account', () => {
      return publicTest(`
          mutation {
            createAccount(input: {
              email: "${testUser.email}",
              password: "${testUser.password}",
              role: Owner
            }) {
              ok
              error
            }
          }`)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: { createAccount },
            },
          } = res;
          expect(createAccount.ok).toBe(true);
          expect(createAccount.error).toBe(null);
        });
    });

    it('should fail if account exist already', () => {
      return publicTest(`
          mutation {
            createAccount(input: {
              email: "${testUser.email}",
              password: "${testUser.password}",
              role: Owner
            }) {
              ok
              error
            }
          }`)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: { createAccount },
            },
          } = res;
          expect(createAccount.ok).toBe(false);
          expect(createAccount.error).toBe(
            'There is a user with that email already',
          );
        });
    });
  });

  describe('login', () => {
    it('should login with correct credentials', () => {
      return publicTest(`
          mutation {
            login(input:{
              email: "${testUser.email}",
              password: "${testUser.password}"
            }) {
              ok
              error
              token
            }
          }`)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(true);
          expect(login.error).toBe(null);
          expect(login.token).toEqual(expect.any(String));
          jwtToken = login.token;
        });
    });

    it('should fail to login with wrong credentials', () => {
      return publicTest(`
          mutation {
            login(input:{
              email: "${testUser.email}",
              password: "bullshitPassword"
            }) {
              ok
              error
              token
            }
          }`)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(false);
          expect(login.error).toBe('Wrong password');
          expect(login.token).toBe(null);
        });
    });
  });

  describe('userProfile', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await userRepo.find();
      userId = user.id;
    });

    it("should see a user's profile", () => {
      return privateTest(`
          {
            userProfile(userId: ${userId}) {
              ok
              error
              user {
                id
              }
            }
          }`)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                userProfile: {
                  ok,
                  error,
                  user: { id },
                },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(id).toBe(userId);
        });
    });

    it('should not find a profile', () => {
      return privateTest(`
          {
            userProfile(userId: 404) {
              ok
              error
              user {
                id
              }
            }
          }`)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                userProfile: { ok, error, user },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toBe('User not found');
          expect(user).toBe(null);
        });
    });
  });

  describe('me', () => {
    it('should find my profile', () => {
      return privateTest(`
          {
            me{
              email
            }
          }`)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;
          expect(email).toBe(testUser.email);
        });
    });

    it('should not allow logged out user', () => {
      return publicTest(`
          {
            me{
              email
            }
          }`)
        .expect(200)
        .expect(res => {
          const {
            body: { errors, data },
          } = res;
          const [error] = errors;
          expect(error.message).toBe('Forbidden resource');
          expect(data).toBe(null);
        });
    });
  });

  describe('editProfile', () => {
    const NEW_EMAIL = 'new@email.com';
    const NEW_PASSWORD = 'newpassword123';

    it('should fail with exist email', () => {
      return privateTest(`
        mutation {
          editProfile(input: {
            email: "${testUser.email}"
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
                editProfile: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toBe('There are already users using this email');
        });
    });

    it('should change email', () => {
      return privateTest(`
          mutation {
            editProfile(input: {
              email: "${NEW_EMAIL}"
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
                editProfile: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    it('should change password', () => {
      return privateTest(`
          mutation {
            editProfile(input: {
              password: "${NEW_PASSWORD}"
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
                editProfile: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    it('should have new email', () => {
      return privateTest(`
          {
            me{
              email
            }
          }`)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;
          expect(email).toBe(NEW_EMAIL);
        });
    });

    it('should success to login with new password and email', () => {
      return privateTest(`
          mutation {
            login(input:{
              email: "${NEW_EMAIL}",
              password: "${NEW_PASSWORD}"
            }) {
              ok
              error
              token
            }
          }`)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                login: { ok, error, token },
              },
            },
          } = res;
          jwtToken = token;
          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(token).toBe(jwtToken);
        });
    });
  });

  describe('verifyEmail', () => {
    let verificationCode: string;
    beforeAll(async () => {
      const [verification] = await verificationRepo.find();
      verificationCode = verification.code;
    });

    it('should verify email', () => {
      return publicTest(`
          mutation {
            verifyEmail(input: {
              code: "${verificationCode}"
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
                verifyEmail: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    it('should fail on verification not found', () => {
      return publicTest(`
          mutation {
            verifyEmail(input: {
              code: "bullshit-code"
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
                verifyEmail: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toBe('Verification not found');
        });
    });
  });
});
