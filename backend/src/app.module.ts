import { Module } from '@nestjs/common';
import { AppController } from './app.controller';

import { AmocrmService } from './amocrm/amocrm.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AmocrmService],
})
export class AppModule {}
