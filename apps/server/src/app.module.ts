import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ChatGateway } from "./chat.gateway";
import { GameGateway } from "./game.gateway";

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ChatGateway, GameGateway],
})
export class AppModule {}
