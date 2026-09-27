# n8n-nodes-velix

Community node for [n8n](https://n8n.io/) to interact with the [Velix WhatsApp API](https://github.com/paulolinder/velix-api).

## Installation

### Community Nodes (recommended)

1. Go to **Settings > Community Nodes** in your n8n instance
2. Click **Install a community node**
3. Enter `n8n-nodes-velix` and confirm

### Manual

```bash
cd ~/.n8n
npm install n8n-nodes-velix
```

## Credentials

Create a **Velix API** credential with:

| Field | Description |
|---|---|
| **Base URL** | Your Velix API URL (e.g. `https://api.velix.dev`) |
| **API Key** | Generated via `POST /v1/auth/api-keys` |

## Nodes

### Velix WhatsApp

Main node with 35 operations across 5 resources:

| Resource | Operations |
|---|---|
| **Instance** | List, Get, Create, Delete, Connect, Disconnect, Logout, Get Status, Request Pair Code, Get Settings, Update Settings, Set Presence, Update Profile |
| **Message** | Send Text, Send Media, Send Location, Send Contact, Send Reaction, Send Poll, Send Batch, Mark as Read, List (contacts or groups, with limit/offset), Search (with limit/offset), Request History, List Scheduled, Cancel Scheduled, Revoke |
| **Contact** | Check WhatsApp, Get Info, Get Picture |
| **Group** | List, Create, Get Info, Update Participants, Leave |
| **Chatwoot** | Sync History |

### Velix WhatsApp Tool

Restricted node for AI Agents — the instance ID is fixed in the node config, and only safe operations are exposed:

- Send Text, Send Image (URL), Send Reaction, Send Location, Send Contact
- Set Presence (typing / recording / paused)
- List Messages — read recent messages from a contact or group chat (`limit` / `offset`)
- Request History — ask WhatsApp for older messages of a chat (async; then use List Messages)

### Pulling older chat history

`Message > List` only returns messages Velix has stored. To import older ones (e.g. the last 100 of a group):

1. **Message > Request History** with the chat JID and `Count = 100` (needs Velix API with `POST /messages/history`)
2. Wait a few seconds (the phone answers asynchronously; it must be online)
3. **Message > List** with `Limit = 100`

Repeat step 1 to page further back. WhatsApp may return fewer messages than requested.

### Velix Trigger

Webhook trigger that receives real-time events from the Velix API:

- Message Received / Sent
- Instance Connected / Disconnected / Logged Out / Paired
- Receipt Delivered / Read
- Filter by event type and instance ID

**Setup:** Configure a webhook in your Velix instance pointing to the trigger URL shown in n8n.

## Compatibility

- n8n >= 1.0.0
- Velix API >= 1.0.0

## License

[MIT](LICENSE)
