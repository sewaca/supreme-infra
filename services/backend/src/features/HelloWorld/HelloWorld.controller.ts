import { Controller, Get } from '@nestjs/common';
import { HelloWorldService } from './HelloWorld.service';

@Controller()
export class HelloWorldController {
  constructor(private readonly helloWorldService: HelloWorldService) {}

  @Get()
  public getHello(): string {
    return this.helloWorldService.getHello();
  }
}
