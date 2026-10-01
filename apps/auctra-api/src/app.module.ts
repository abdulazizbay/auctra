import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver } from "@nestjs/apollo";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AppResolver } from "./app.resolver";
import { DatabaseModule } from "./database/database.module";
import { ComponentsModule } from "./components/components.module";
import { SocketModule } from "./socket/socket.module";
import { T } from "./libs/types/common";

@Module({
  imports: [
    ConfigModule.forRoot(),
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      playground: true,
      uploads: false,
      autoSchemaFile: true,
      formatError: (error: T) => {
        console.log(error);
        const graphQLFormattedError = {
          code: error?.extensions?.code,
          message: error?.extensions?.response?.message || error?.message,
        };
        return graphQLFormattedError;
      },
    }),
    ComponentsModule,
    SocketModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppResolver],
})
export class AppModule {}
