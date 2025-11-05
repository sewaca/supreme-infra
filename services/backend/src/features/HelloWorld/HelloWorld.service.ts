import { Injectable } from '@nestjs/common';
import { HelloWorldRepository } from './HelloWorld.repository';

@Injectable()
export class HelloWorldService {
  constructor(private helloWorldRepository: HelloWorldRepository) {}

  public getHello(): string {
    return this.helloWorldRepository.getUserGreeting();
  }
}
