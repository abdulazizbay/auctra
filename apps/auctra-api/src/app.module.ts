import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GraphQLModule } from "@nestjs/graphql";
import { BullModule } from "@nestjs/bullmq";
import { ThrottlerModule, minutes } from "@nestjs/throttler";
import { ThrottlerStorageRedisService } from "@nest-lab/throttler-storage-redis";
import { ApolloDriver } from "@nestjs/apollo";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AppResolver } from "./app.resolver";
import { DatabaseModule } from "./database/database.module";
import { ComponentsModule } from "./components/components.module";
import { SocketModule } from "./socket/socket.module";
import { T } from "./libs/types/common";
import { redisConnection } from "./libs/config";
import { Message } from "./libs/enums/common.enum";

@Module({
  imports: [
    ConfigModule.forRoot(),
    BullModule.forRoot({
      connection: { ...redisConnection(), enableOfflineQueue: false },
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: minutes(1), limit: 60 }],
      storage: new ThrottlerStorageRedisService(redisConnection()),
      errorMessage: Message.TOO_MANY_REQUESTS,
    }),
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      playground: process.env.NODE_ENV !== "production",
      introspection: process.env.NODE_ENV !== "production",
      uploads: false,
      autoSchemaFile: true,
      context: ({ req, res }) => ({ req, res }),
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
