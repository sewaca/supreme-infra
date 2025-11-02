import { Module } from "@nestjs/common";
import { HelloWorldController } from "./HelloWorld.controller";
import { HelloWorldRepository } from "./HelloWorld.repository";
import { HelloWorldService } from "./HelloWorld.service";

@Module({
  imports: [],
  controllers: [HelloWorldController],
  providers: [HelloWorldService, HelloWorldRepository],
})
export class HelloWorldModule {}
