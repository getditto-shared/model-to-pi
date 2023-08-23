# Exemplar Ditto app for syncing an attachment

* `sender.ts` creates the attachment
* `receiver.ts` receives the update, and fetches the attachment

Requires a `.env` file containing:

```
APP_ID
APP_TOKEN
```

Can get those from the Ditto portal https://portal.ditto.live for your test application.

Example takes the `rp.jpg` file and syncs it between the sender and receiver.
