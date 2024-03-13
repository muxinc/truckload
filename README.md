# Truckload

Moving your video collection with ease

<img src="public/truckload.png" alt="Truckload" width="200px">

## How to use

### Start development server

`yarn dev`

### Run local Inngest server

`npx inngest-cli@latest dev`

### Run partykit server

`cd app && npx partykit dev`

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
