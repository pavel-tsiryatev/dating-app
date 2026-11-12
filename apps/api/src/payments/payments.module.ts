import { Module } from '@nestjs/common';
import { FakePaymentProvider, PAYMENT_PROVIDER } from './payment-provider';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

/** Блок A5 «Принимать и проверять оплату»: задачи 51–53. */
@Module({
  controllers: [PaymentsController],
  exports: [PaymentsService],
  providers: [PaymentsService, { provide: PAYMENT_PROVIDER, useClass: FakePaymentProvider }],
})
export class PaymentsModule {}
