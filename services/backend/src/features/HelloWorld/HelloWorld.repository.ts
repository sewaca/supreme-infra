import { Injectable } from "@nestjs/common";

@Injectable()
export class HelloWorldRepository {
  public getUserGreeting(): string {
    return "Hello World!";
  }
}
