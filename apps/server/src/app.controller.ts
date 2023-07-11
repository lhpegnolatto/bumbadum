import { Controller, Get } from "@nestjs/common";
import { AppService } from "./providers/app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/health")
  getHealth(): boolean {
    return this.appService.getHealth();
  }
}
