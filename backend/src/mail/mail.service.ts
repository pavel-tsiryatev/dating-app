import { Global, Injectable, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

/** Отправка одноразового кода на почту вуза (A12). Без SMTP_HOST код пишется в лог — для разработки. */
@Injectable()
export class MailService {
  private readonly log = new Logger('Mail');
  private readonly transport?: Transporter;
  private readonly from: string;

  constructor(config: ConfigService) {
    this.from = config.get<string>('MAIL_FROM') ?? 'CAMPUS <no-reply@example.com>';
    const host = config.get<string>('SMTP_HOST');
    if (host) {
      const port = Number(config.get('SMTP_PORT') ?? 465);
      this.transport = createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user: config.get<string>('SMTP_USER'), pass: config.get<string>('SMTP_PASS') },
      });
    }
  }

  async sendCode(email: string, code: string): Promise<void> {
    if (!this.transport) {
      this.log.warn(`SMTP не настроен. Код для ${email}: ${code}`);
      return;
    }
    await this.transport.sendMail({
      from: this.from,
      to: email,
      subject: `Код для входа в CAMPUS: ${code}`,
      text: `Ваш код: ${code}. Он действует 10 минут. Если вы не запрашивали код, просто проигнорируйте письмо.`,
    });
  }
}

@Global()
@Module({ providers: [MailService], exports: [MailService] })
export class MailModule {}
