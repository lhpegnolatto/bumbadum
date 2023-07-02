import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ChatGateway } from "./chat.gateway";
import { GameGateway } from "./game.gateway";

@Module({
  imports: [HttpModule],
  controllers: [AppController],
  providers: [AppService, ChatGateway, GameGateway],
})
export class AppModule {}
