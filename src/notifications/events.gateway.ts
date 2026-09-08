import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');

  afterInit() {
    this.logger.log('🚀 WebSocket Gateway initialized for real-time draw updates');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitTicketReserved(ticketNumber: number, roundId: string) {
    this.server.emit('ticket.reserved', { ticketNumber, roundId });
  }

  emitTicketConfirmed(ticketNumber: number, roundId: string) {
    this.server.emit('ticket.confirmed', { ticketNumber, roundId });
  }

  emitTicketReleased(ticketNumber: number, roundId: string) {
    this.server.emit('ticket.released', { ticketNumber, roundId });
  }

  emitRoundUpdated(round: any) {
    this.server.emit('round.updated', round);
  }

  emitWinnerDrawn(winnerData: any) {
    this.server.emit('draw.winner', winnerData);
  }
}
