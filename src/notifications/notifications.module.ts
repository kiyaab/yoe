import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EventsGateway } from './events.gateway';

@Global()
@Module({
  providers: [NotificationsService, EventsGateway],
  exports: [NotificationsService, EventsGateway],
})
export class NotificationsModule {}
