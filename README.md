# Truckload

Moving your video collection with ease

<img src="public/truckload.png" alt="Truckload" width="200px">

## How to use

### Start development server

`yarn dev`

### Run local Inngest server

[Inngest](https://www.inngest.com) makes serverless queues, background jobs, and workflows effortless. Truckload uses Inngest to facilitate the loading and migrating of each video.

You can start a [local Inngest development server](https://www.inngest.com/docs/local-development) with the following command:

`npx inngest-cli@latest dev`

### Run PartyKit server

[PartyKit](https://www.partykit.io/) is a comprehensive solution for real-time sync within your application.

In this app, we're really only using it to receive status updates from the video migration background jobs and destination webhooks.

To receive these notifications and pipe them back to the front-end for status updates, you need to start a PartyKit server locally.

`cd app && npx partykit dev`

PartyKit will spin up on port `1999`

## Handling webhooks

Some destinations (like Mux) use webhooks to communicate migration progress to your application.

This presents a challenge when you're running this app locally, as you'll need a public URL that can
be reached by an HTTP request issued by your destination service.

To solve this, you can stand up a free, publicly-accessible tunnel URL using ngrok. Here's how:

1. Visit https://ngrok.com
2. Sign in with your existing account or with GitHub
3. Follow the instructions to install and authenticate `ngrok` on your machine
4. Create an `ngrok` endpoint for your local app by running `ngrok http http://localhost:3000`
5. Grab the resulting URL for use as your webhook destination:

<img src="public/screenshots/ngrok-url.png" alt="Ngrok URL" width="500px">

## Resources

- [AWS SDK v3 API reference](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/)
- [Mux API reference](https://docs.mux.com/api-reference)

## Cloudflare Stream

You'll need an [API Token](https://dash.cloudflare.com/profile/api-tokens) with write access to connect your account.

### Account ID

This value can be found in the dashboard sidebar and is used to find your Stream account.
