import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./providers/app.service";
import { ChatGateway } from "./providers/chat.gateway";
import { GameGateway } from "./providers/game.gateway";

@Module({
  imports: [HttpModule, ConfigModule.forRoot({ envFilePath: ".env.local" })],
  controllers: [AppController],
  providers: [AppService, ChatGateway, GameGateway],
})
export class AppModule {}
