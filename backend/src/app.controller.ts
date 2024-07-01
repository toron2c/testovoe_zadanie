import { Controller, Get, Query, Res } from '@nestjs/common';

import { Response } from 'express';
import { AmocrmService } from './amocrm/amocrm.service';

@Controller()
export class AppController {
  private isFirstLoad = true;
  constructor(private readonly amocrmService: AmocrmService) {}

  @Get('leads')
  async getLeads(@Res() res: Response, @Query('query') query?: string) {
    // first load, initiailize tokens with code auth
    if (this.isFirstLoad) {
      await this.amocrmService.getTokens();
      this.isFirstLoad = false;
      console.log(this.amocrmService.getAccessToken());
    }
    const data = {
      leads: await this.amocrmService.getLeads(query),
    };
    return res.json(data);
  }
}
