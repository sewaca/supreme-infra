import { Module } from "@nestjs/common";
import { HelloWorldModule } from "./features/HelloWorld/HelloWorld.module";

@Module({
  imports: [HelloWorldModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
