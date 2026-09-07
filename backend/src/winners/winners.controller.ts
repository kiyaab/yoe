import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WinnersService } from './winners.service';

@ApiTags('winners')
@Controller('winners')
export class WinnersController {
  constructor(private readonly winnersService: WinnersService) {}

  @Get()
  @ApiOperation({ summary: 'Get historical rounds and authenticated winners (Public)' })
  async getPublicWinners() {
    return this.winnersService.getPublicWinners();
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get latest winners for marketing hero / announcement banner' })
  async getLatestWinners() {
    return this.winnersService.getLatestWinners();
  }
}
