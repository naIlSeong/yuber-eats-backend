import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constant';
import { MailModuleOptions, EmailVar } from './mail.interface';
import got from 'got';
import * as FormData from 'form-data';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {}

  async sendEmail(subject: string, template: string, emailVar: EmailVar[]) {
    const form = new FormData();
    form.append(
      'from',
      `Ilseong from Yuber Eats <mailgun@${this.options.domain}>`,
    );
    form.append('to', 'ilseongdev@gmail.com');
    form.append('subject', subject);
    form.append('template', template);
    emailVar.forEach(eVar => form.append(`v:${eVar.key}`, eVar.value));
    try {
      await got(`https://api.mailgun.net/v3/${this.options.domain}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `api:${this.options.apiKey}`,
          ).toString('base64')}`,
        },
        body: form,
      });
    } catch (error) {
      console.log(error);
    }
  }

  sendVerificationEmail(email: string, code: string) {
    this.sendEmail('Verify Your Email', 'verify-email', [
      { key: 'code', value: code },
      { key: 'username', value: email },
    ]);
  }
}
