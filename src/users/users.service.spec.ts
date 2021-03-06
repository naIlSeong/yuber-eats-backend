import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { UserService } from './users.service';

const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  findOneOrFail: jest.fn(),
  delete: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(() => 'signed-bullshit-token'),
  verify: jest.fn(),
});

const mockMailService = () => ({
  sendVerificationEmail: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UserService', () => {
  let service: UserService;
  let mailService: MailService;
  let jwtService: JwtService;
  let userRepo: MockRepository<User>;
  let verificationRepo: MockRepository<Verification>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockRepository(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService(),
        },
        {
          provide: MailService,
          useValue: mockMailService(),
        },
      ],
    }).compile();
    service = module.get<UserService>(UserService);
    mailService = module.get<MailService>(MailService);
    jwtService = module.get<JwtService>(JwtService);
    userRepo = module.get(getRepositoryToken(User));
    verificationRepo = module.get(getRepositoryToken(Verification));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    const createAccountArgs = {
      email: 'mock@mail.com',
      password: 'mockpassword',
      role: 0,
    };

    it('should fail if user exists', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 1,
        email: '',
      });
      const result = await service.createAccount(createAccountArgs);
      expect(result).toMatchObject({
        ok: false,
        error: 'There is a user with that email already',
      });
    });

    it('should create a new user', async () => {
      userRepo.findOne.mockResolvedValue(undefined);
      userRepo.create.mockReturnValue(createAccountArgs);
      userRepo.save.mockResolvedValue(createAccountArgs);
      verificationRepo.create.mockReturnValue({ user: createAccountArgs });
      verificationRepo.save.mockResolvedValue({
        code: 'code',
      });
      const result = await service.createAccount(createAccountArgs);

      expect(userRepo.create).toBeCalledTimes(1);
      expect(userRepo.create).toBeCalledWith(createAccountArgs);

      expect(userRepo.save).toBeCalledTimes(1);
      expect(userRepo.save).toBeCalledWith(createAccountArgs);

      expect(verificationRepo.create).toBeCalledTimes(1);
      expect(verificationRepo.create).toBeCalledWith({
        user: createAccountArgs,
      });

      expect(verificationRepo.save).toBeCalledTimes(1);
      expect(verificationRepo.save).toBeCalledWith({ user: createAccountArgs });

      expect(mailService.sendVerificationEmail).toBeCalledTimes(1);
      expect(mailService.sendVerificationEmail).toBeCalledWith(
        expect.any(String),
        expect.any(String),
      );

      expect(result).toEqual({ ok: true });
    });

    it('should fail on exception', async () => {
      userRepo.findOne.mockRejectedValue(new Error());
      const result = await service.createAccount(createAccountArgs);
      expect(result).toEqual({ ok: false, error: "Couldn't create account" });
    });
  });

  describe('login', () => {
    const loginArgs = {
      email: 'mock@mail.com',
      password: 'mockpassword',
    };

    it('should fail if user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);
      const result = await service.login(loginArgs);

      expect(userRepo.findOne).toHaveBeenCalledTimes(1);
      expect(userRepo.findOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );

      expect(result).toEqual({ ok: false, error: 'User not found' });
    });

    it('should fail if the password is wrong', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };
      userRepo.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);

      expect(result).toEqual({ ok: false, error: 'Wrong password' });
    });

    it('should return token if the password is correct', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };
      userRepo.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);

      expect(jwtService.sign).toBeCalledTimes(1);
      expect(jwtService.sign).toBeCalledWith(expect.any(Number));

      expect(result).toEqual({ ok: true, token: 'signed-bullshit-token' });
    });

    it('should fail on exception', async () => {
      userRepo.findOne.mockRejectedValue(new Error());
      const result = await service.login(loginArgs);

      expect(result).toEqual({ ok: false, error: "Can't login now" });
    });
  });

  describe('findById', () => {
    const findByIdArgs = { id: 1 };

    it('should find an existing user', async () => {
      userRepo.findOneOrFail.mockResolvedValue(findByIdArgs);
      const result = await service.findById(1);

      expect(userRepo.findOneOrFail).toBeCalledTimes(1);
      expect(userRepo.findOneOrFail).toBeCalledWith(findByIdArgs);

      expect(result).toEqual({
        ok: true,
        user: findByIdArgs,
      });
    });

    it('should fail if the user does not exists', async () => {
      userRepo.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.findById(1);

      expect(result).toEqual({
        ok: false,
        error: 'User not found',
      });
    });
  });

  describe('editProfile', () => {
    it('should fail with exist email', async () => {
      const oldUser = {
        userId: 1,
        email: 'mock@mail.com',
        verified: true,
      };
      const newUser = {
        userId: 2,
        email: oldUser.email,
      };

      userRepo.findOne.mockResolvedValue({ email: oldUser.email });
      const result = await service.editProfile(newUser.userId, {
        email: newUser.email,
      });

      expect(userRepo.findOne).toBeCalledTimes(1);
      expect(userRepo.findOne).toBeCalledWith({ email: newUser.email });

      expect(result).toEqual({
        ok: false,
        error: 'There are already users using this email',
      });
    });

    it('should change email', async () => {
      const oldUser = {
        email: 'mock@mail.com',
        verified: true,
      };
      const editProfileArgs = {
        userId: 1,
        input: { email: 'new@mail.com' },
      };
      const newVerification = {
        code: 'code',
      };
      const newUser = {
        email: editProfileArgs.input.email,
        verified: false,
      };

      userRepo.findOneOrFail.mockResolvedValue(oldUser);
      verificationRepo.create.mockReturnValue(newVerification);
      verificationRepo.save.mockResolvedValue(newVerification);
      mailService.sendVerificationEmail(
        editProfileArgs.input.email,
        newVerification.code,
      );
      await service.editProfile(editProfileArgs.userId, editProfileArgs.input);

      expect(userRepo.findOneOrFail).toBeCalledTimes(1);
      expect(userRepo.findOneOrFail).toBeCalledWith(editProfileArgs.userId);

      expect(verificationRepo.create).toBeCalledWith({ user: newUser });
      expect(verificationRepo.save).toBeCalledWith(newVerification);

      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        newUser.email,
        newVerification.code,
      );

      expect(userRepo.save).toHaveBeenCalledTimes(1);
      expect(userRepo.save).toHaveBeenCalledWith(newUser);
    });

    it('should change password', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { password: 'newpassword' },
      };

      userRepo.findOneOrFail.mockResolvedValue({ password: 'oldpassword' });
      const result = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(userRepo.findOneOrFail).toBeCalledTimes(1);
      expect(userRepo.findOneOrFail).toBeCalledWith(editProfileArgs.userId);

      expect(userRepo.save).toHaveBeenCalledTimes(1);
      expect(userRepo.save).toHaveBeenCalledWith(editProfileArgs.input);

      expect(result).toEqual({ ok: true });
    });

    it('should fail on exception', async () => {
      userRepo.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.editProfile(1, { email: '', password: '' });

      expect(result).toEqual({ ok: false, error: "Can't edit profile now" });
    });
  });

  describe('verifyEmail', () => {
    const mockedVerification = {
      user: { verified: true },
      id: 1,
    };
    it('should verify email', async () => {
      verificationRepo.findOne.mockResolvedValue(mockedVerification);
      const result = await service.verifyEmail('');

      expect(verificationRepo.findOne).toHaveBeenCalledTimes(1);
      expect(verificationRepo.findOne).toHaveBeenCalledWith(
        { code: '' },
        expect.any(Object),
      );

      expect(userRepo.save).toHaveBeenCalledTimes(1);
      expect(userRepo.save).toHaveBeenCalledWith({ verified: true });

      expect(verificationRepo.delete).toHaveBeenCalledTimes(1);
      expect(verificationRepo.delete).toHaveBeenCalledWith(
        mockedVerification.id,
      );

      expect(result).toEqual({ ok: true });
    });

    it('should fail on verification not found', async () => {
      verificationRepo.findOne.mockResolvedValue(undefined);
      const result = await service.verifyEmail('');

      expect(result).toEqual({
        ok: false,
        error: 'Verification not found',
      });
    });

    it('should fail on exception', async () => {
      verificationRepo.findOne.mockRejectedValue(new Error());
      const result = await service.verifyEmail('');

      expect(result).toEqual({
        ok: false,
        error: "Can't edit profile now",
      });
    });
  });
});
