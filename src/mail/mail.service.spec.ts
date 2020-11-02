import { Test } from '@nestjs/testing';
import { CONFIG_OPTIONS } from 'src/common/common.constant';
import { MailService } from './mail.service';

const API_KEY = 'API_KEY';
const DOMAIN = 'mock.domain.com';
const FROM_EMAIL = 'mock@mail.com';

jest.mock('got', () => {});
jest.mock('form-data', () => {
  return {
    append: jest.fn(),
  };
});

describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: CONFIG_OPTIONS,
          useValue: {
            apiKey: API_KEY,
            domain: DOMAIN,
            fromEmail: FROM_EMAIL,
          },
        },
      ],
    }).compile();
    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    it('should call sendEmail', () => {
      const sendVerificationEmailArgs = {
        email: 'mock@mail.com',
        code: 'mockedCode',
      };
      jest.spyOn(service, 'sendEmail').mockImplementation(async () => {
        console.log('hellooooo');
      });
      service.sendVerificationEmail(
        sendVerificationEmailArgs.email,
        sendVerificationEmailArgs.code,
      );

      expect(service.sendEmail).toHaveBeenCalledTimes(1);
      expect(service.sendEmail).toHaveBeenCalledWith(
        'Verify Your Email',
        'verify-email',
        [
          { key: 'code', value: sendVerificationEmailArgs.code },
          { key: 'username', value: sendVerificationEmailArgs.email },
        ],
      );
    });
  });

  it.todo('sendEmail');
});
