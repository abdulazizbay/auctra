# Auctra API

Backend for **Auctra**, a live auction marketplace for pre-owned luxury watches, jewellery, art and collectibles.

- Live: https://217-142-246-228.sslip.io
- Frontend: [auctra-next](https://github.com/abdulazizbay/auctra-next)

## Features

- **Live bidding**: bids are placed through a GraphQL mutation, and every viewer of the lot receives the update over WebSocket.
- **Concurrency-safe bids**: each bid is one atomic compare-and-set on the lot document. The minimum increment and the optional ceiling price (buy-now) are checked inside the same update.
- **Scheduled lots**: lots open and close at their exact times through delayed BullMQ jobs. A 5-minute cron sweep catches any lot that was due while Redis or the worker was down.
- **Orders**: when a lot closes, the winning item is added to a pending order for that buyer and seller in one MongoDB transaction, so wins from one seller ship together. Payment is simulated (status changes only). Unpaid orders expire.
- **Reviews**: buyers can review a seller once per completed order.
- **Community**: articles, comments, likes, follows, views and a watchlist.
- **Real-time**: a global chat lobby, private order chat between buyer and seller, live notifications and alerts to followers.
- **Auth**: JWT, Google and Kakao sign-in, and roles (`USER`, `SELLER`, `ADMIN`). Users apply to become sellers, and admins approve them.
- **Redis**:
  - BullMQ queue for scheduling lots
  - Rate limits on chosen mutations
  - Query cache with version-key invalidation
- **Admin**: moderation of members, sellers, lots, articles, notices and FAQ.

## Tech Stack

| Area | Tech |
|---|---|
| Framework | NestJS 10, TypeScript |
| API | GraphQL (Apollo Server 4, code-first), `graphql-upload` |
| Database | MongoDB Atlas, Mongoose 8 |
| Real-time | WebSocket (`@nestjs/platform-ws`, `ws`) |
| Jobs | BullMQ, `@nestjs/schedule` |
| Cache / limits | Redis 7, ioredis, `@nestjs/throttler` |
| Auth | JWT, bcryptjs, Google (`google-auth-library`), Kakao |

## Architecture

A NestJS monorepo with two apps that share one MongoDB database and one Redis instance:

```
apps/
  auctra-api/      GraphQL API + WebSocket gateway
    src/
      components/  member, auth, lot, bid, order, review, message,
                   notification, watch, view, like, follow,
                   article, comment, notice
      schemas/     Mongoose models
      socket/      WS gateway (rooms: lobby, lot:, member:, order:)
      libs/        dto, enums, types, cache, interceptor, config
  auctra-batch/    BullMQ worker (openLot / closeLot) + cron jobs
```

- **API** handles GraphQL requests and WebSocket connections. On `createLot` and `updateLot` it adds delayed `openLot` / `closeLot` jobs.
- **Batch** opens and closes lots, creates orders and expires unpaid orders. After each commit it calls the API's internal `POST /socket/emit` relay (protected by a shared secret), so results reach clients over the API's WebSocket.
- Lot statuses: `SCHEDULED → OPEN → SOLD | UNSOLD` (or `CANCELLED` by an admin).
- Order statuses: `PENDING_PAYMENT → PAID → SHIPPED → COMPLETED` (or `EXPIRED` / `CANCELLED`).

## Getting Started

Requirements: Node.js, a MongoDB database, Docker (for Redis).

```bash
npm install
docker compose up -d
```

Create a `.env` file in the project root:

```
NODE_ENV=development
PORT_API=3009
PORT_BATCH=3010
MONGO_DEV=
MONGO_PROD=
SECRET_TOKEN=
CORS_ORIGIN=http://localhost:3000
REDIS_HOST=localhost
REDIS_PORT=6379
GOOGLE_CLIENT_ID=
KAKAO_REST_KEY=
KAKAO_CLIENT_SECRET=
KAKAO_REDIRECT_URI=
```

Run the API and the batch worker in two terminals:

```bash
npm run start:dev
npm run start:dev:batch
```

GraphQL endpoint: `http://localhost:3009/graphql`. Uploaded images are served from `/uploads`.

## Scripts

| Command | Description |
|---|---|
| `npm run start:dev` | API in watch mode |
| `npm run start:dev:batch` | Batch worker in watch mode |
| `npm run build` | Build both apps to `dist/` |
| `npm run start:prod` | Run the built API |
| `npm run start:prod:batch` | Run the built batch worker |
| `npm run format` | Prettier |
