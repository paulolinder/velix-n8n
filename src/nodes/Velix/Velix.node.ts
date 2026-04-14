import {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';

export class Velix implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Velix WhatsApp',
		name: 'velix',
		icon: 'file:velix.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Interact with the Velix WhatsApp API',
		defaults: { name: 'Velix WhatsApp' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'velixApi',
				required: true,
			},
		],
		properties: [
			// ── Resource selector ─────────────────────────────
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Instance', value: 'instance' },
					{ name: 'Message', value: 'message' },
					{ name: 'Contact', value: 'contact' },
					{ name: 'Group', value: 'group' },
					{ name: 'Chatwoot', value: 'chatwoot' },
				],
				default: 'message',
			},

			// ── Instance operations ───────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['instance'] } },
				options: [
					{ name: 'List', value: 'list', action: 'List all instances' },
					{ name: 'Get', value: 'get', action: 'Get instance details' },
					{ name: 'Create', value: 'create', action: 'Create an instance' },
					{ name: 'Delete', value: 'delete', action: 'Delete an instance' },
					{ name: 'Connect', value: 'connect', action: 'Connect an instance' },
					{ name: 'Disconnect', value: 'disconnect', action: 'Disconnect an instance' },
					{ name: 'Logout', value: 'logout', action: 'Logout an instance' },
					{ name: 'Get Status', value: 'getStatus', action: 'Get instance status' },
					{ name: 'Request Pair Code', value: 'pairCode', action: 'Request a numeric pair code' },
					{ name: 'Get Settings', value: 'getSettings', action: 'Get instance settings' },
					{ name: 'Update Settings', value: 'updateSettings', action: 'Update instance settings' },
					{ name: 'Set Presence', value: 'setPresence', action: 'Set typing/online presence' },
					{ name: 'Update Profile', value: 'updateProfile', action: 'Update display name' },
				],
				default: 'list',
			},

			// ── Message operations ────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['message'] } },
				options: [
					{ name: 'Send Text', value: 'sendText', action: 'Send a text message' },
					{ name: 'Send Media', value: 'sendMedia', action: 'Send a media message' },
					{ name: 'Send Location', value: 'sendLocation', action: 'Send a location' },
					{ name: 'Send Contact', value: 'sendContact', action: 'Send a contact card' },
					{ name: 'Send Reaction', value: 'sendReaction', action: 'React to a message' },
					{ name: 'Send Poll', value: 'sendPoll', action: 'Send a poll' },
					{ name: 'Send Batch', value: 'sendBatch', action: 'Send up to 100 texts in one call' },
					{ name: 'Mark as Read', value: 'markRead', action: 'Mark messages as read' },
					{ name: 'List', value: 'list', action: 'List messages for a chat' },
					{ name: 'Search', value: 'search', action: 'Search messages' },
					{ name: 'List Scheduled', value: 'listScheduled', action: 'List scheduled messages' },
					{ name: 'Cancel Scheduled', value: 'cancelScheduled', action: 'Cancel a scheduled message' },
					{ name: 'Revoke', value: 'revoke', action: 'Delete a sent message for everyone' },
				],
				default: 'sendText',
			},

			// ── Contact operations ────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['contact'] } },
				options: [
					{ name: 'Check WhatsApp', value: 'check', action: 'Check if numbers are on WhatsApp' },
					{ name: 'Get Info', value: 'getInfo', action: 'Get contact info' },
					{ name: 'Get Picture', value: 'getPicture', action: 'Get profile picture URL' },
				],
				default: 'check',
			},

			// ── Group operations ──────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['group'] } },
				options: [
					{ name: 'List', value: 'list', action: 'List joined groups' },
					{ name: 'Create', value: 'create', action: 'Create a group' },
					{ name: 'Get Info', value: 'getInfo', action: 'Get group details' },
					{ name: 'Update Participants', value: 'updateParticipants', action: 'Add/remove participants' },
					{ name: 'Leave', value: 'leave', action: 'Leave a group' },
				],
				default: 'list',
			},

			// ── Chatwoot operations ───────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['chatwoot'] } },
				options: [
					{ name: 'Sync History', value: 'syncHistory', action: 'Sync WhatsApp history to Chatwoot' },
				],
				default: 'syncHistory',
			},

			// ── Common: Instance ID (message / contact / group / chatwoot) ──
			{
				displayName: 'Instance ID',
				name: 'instanceId',
				type: 'string',
				required: true,
				default: '',
				description: 'UUID of the WhatsApp instance',
				displayOptions: {
					show: {
						resource: ['message', 'contact', 'group', 'chatwoot'],
					},
				},
			},
			// ── Common: Instance ID (instance resource — ops that need it) ──
			{
				displayName: 'Instance ID',
				name: 'instanceId',
				type: 'string',
				required: true,
				default: '',
				description: 'UUID of the WhatsApp instance',
				displayOptions: {
					show: {
						resource: ['instance'],
						operation: ['get', 'delete', 'connect', 'disconnect', 'logout', 'getStatus', 'pairCode', 'getSettings', 'updateSettings', 'setPresence', 'updateProfile'],
					},
				},
			},

			// ── Instance: Create ──────────────────────────────
			{
				displayName: 'Instance Name',
				name: 'instanceName',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['instance'], operation: ['create'] } },
			},

			// ── Instance: Pair Code ───────────────────────────
			{
				displayName: 'Phone Number',
				name: 'pairPhone',
				type: 'string',
				required: true,
				default: '',
				placeholder: '5511999990001',
				description: 'Phone number to pair (digits only, with country code)',
				displayOptions: { show: { resource: ['instance'], operation: ['pairCode'] } },
			},

			// ── Instance: Update Settings (JSON) ──────────────
			{
				displayName: 'Settings (JSON)',
				name: 'settingsJson',
				type: 'json',
				required: true,
				default: '{}',
				description: 'Partial settings object (e.g. {"reject_call":true,"always_online":true})',
				displayOptions: { show: { resource: ['instance'], operation: ['updateSettings'] } },
			},

			// ── Instance: Set Presence ────────────────────────
			{
				displayName: 'Chat JID',
				name: 'presenceChat',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['instance'], operation: ['setPresence'] } },
			},
			{
				displayName: 'Presence Type',
				name: 'presenceType',
				type: 'options',
				options: [
					{ name: 'Typing', value: 'typing' },
					{ name: 'Recording', value: 'recording' },
					{ name: 'Paused', value: 'paused' },
					{ name: 'Available', value: 'available' },
					{ name: 'Unavailable', value: 'unavailable' },
				],
				default: 'typing',
				displayOptions: { show: { resource: ['instance'], operation: ['setPresence'] } },
			},

			// ── Instance: Update Profile ──────────────────────
			{
				displayName: 'Display Name',
				name: 'profileName',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['instance'], operation: ['updateProfile'] } },
			},

			// ── Message: To (JID) ─────────────────────────────
			// Hidden for operations that don't target a specific recipient.
			// Note: 'revoke' needs 'to' (chat JID) — intentionally NOT in the hide list.
			{
				displayName: 'To (JID)',
				name: 'to',
				type: 'string',
				required: true,
				default: '',
				placeholder: '5511999990001@s.whatsapp.net',
				description: 'Recipient JID (phone@s.whatsapp.net or group@g.us). For Revoke, enter the chat JID where the message lives.',
				displayOptions: {
					show: { resource: ['message'] },
					hide: { operation: ['list', 'search', 'listScheduled', 'cancelScheduled'] },
				},
			},
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				typeOptions: { rows: 4 },
				required: true,
				default: '',
				displayOptions: { show: { resource: ['message'], operation: ['sendText'] } },
			},

			// ── Message: Send Media ───────────────────────────
			{
				displayName: 'Media Type',
				name: 'mediaType',
				type: 'options',
				options: [
					{ name: 'Image', value: 'image' },
					{ name: 'Video', value: 'video' },
					{ name: 'Audio', value: 'audio' },
					{ name: 'Document', value: 'document' },
					{ name: 'Sticker', value: 'sticker' },
				],
				default: 'image',
				displayOptions: { show: { resource: ['message'], operation: ['sendMedia'] } },
			},
			{
				displayName: 'Media (Base64)',
				name: 'mediaData',
				type: 'string',
				required: true,
				default: '',
				description: 'Base64-encoded file content',
				displayOptions: { show: { resource: ['message'], operation: ['sendMedia'] } },
			},
			{
				displayName: 'Caption',
				name: 'caption',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['message'], operation: ['sendMedia'] } },
			},
			{
				displayName: 'File Name',
				name: 'fileName',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['message'], operation: ['sendMedia'] } },
			},

			// ── Message: Send Location ────────────────────────
			{
				displayName: 'Latitude',
				name: 'latitude',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: { show: { resource: ['message'], operation: ['sendLocation'] } },
			},
			{
				displayName: 'Longitude',
				name: 'longitude',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: { show: { resource: ['message'], operation: ['sendLocation'] } },
			},
			{
				displayName: 'Location Name',
				name: 'locationName',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['message'], operation: ['sendLocation'] } },
			},

			// ── Message: Send Contact ─────────────────────────
			{
				displayName: 'Contact Name',
				name: 'contactName',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['message'], operation: ['sendContact'] } },
			},
			{
				displayName: 'Contact Phone',
				name: 'contactPhone',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['message'], operation: ['sendContact'] } },
			},

			// ── Message: Reaction / Read / Revoke ────────────
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['message'], operation: ['sendReaction', 'markRead', 'revoke', 'cancelScheduled'] } },
			},
			{
				displayName: 'Emoji',
				name: 'emoji',
				type: 'string',
				required: true,
				default: '👍',
				displayOptions: { show: { resource: ['message'], operation: ['sendReaction'] } },
			},

			// ── Message: Poll ─────────────────────────────────
			{
				displayName: 'Question',
				name: 'question',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['message'], operation: ['sendPoll'] } },
			},
			{
				displayName: 'Options',
				name: 'pollOptions',
				type: 'string',
				required: true,
				default: '',
				description: 'Comma-separated poll options',
				displayOptions: { show: { resource: ['message'], operation: ['sendPoll'] } },
			},

			// ── Message: Batch ────────────────────────────────
			{
				displayName: 'Messages (JSON)',
				name: 'batchMessages',
				type: 'json',
				required: true,
				default: '[{"to":"5511999990001@s.whatsapp.net","text":"Hello"}]',
				description: 'Array of {to, text} objects (max 100)',
				displayOptions: { show: { resource: ['message'], operation: ['sendBatch'] } },
			},

			// ── Message: List / Search ────────────────────────
			{
				displayName: 'Chat JID',
				name: 'chatJid',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['message'], operation: ['list'] } },
			},
			{
				displayName: 'Search Query',
				name: 'searchQuery',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['message'], operation: ['search'] } },
			},

			// ── Contact: Check ────────────────────────────────
			{
				displayName: 'Phone Numbers',
				name: 'phones',
				type: 'string',
				required: true,
				default: '',
				description: 'Comma-separated phone numbers (e.g. 5511999990001,5511999990002)',
				displayOptions: { show: { resource: ['contact'], operation: ['check'] } },
			},

			// ── Contact: Get Info / Picture ───────────────────
			{
				displayName: 'JID',
				name: 'jid',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['contact'], operation: ['getInfo', 'getPicture'] } },
			},

			// ── Group: Create ─────────────────────────────────
			{
				displayName: 'Group Name',
				name: 'groupName',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['group'], operation: ['create'] } },
			},
			{
				displayName: 'Participants',
				name: 'participants',
				type: 'string',
				required: true,
				default: '',
				description: 'Comma-separated JIDs to add',
				displayOptions: { show: { resource: ['group'], operation: ['create', 'updateParticipants'] } },
			},

			// ── Group: Get Info / Leave / Update ──────────────
			{
				displayName: 'Group JID',
				name: 'groupJid',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['group'], operation: ['getInfo', 'updateParticipants', 'leave'] } },
			},
			{
				displayName: 'Action',
				name: 'participantAction',
				type: 'options',
				options: [
					{ name: 'Add', value: 'add' },
					{ name: 'Remove', value: 'remove' },
					{ name: 'Promote', value: 'promote' },
					{ name: 'Demote', value: 'demote' },
				],
				default: 'add',
				displayOptions: { show: { resource: ['group'], operation: ['updateParticipants'] } },
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('velixApi');
		const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');
		const apiKey = credentials.apiKey as string;

		// Default MIME types derived from the media type selector.
		const mimeTypeMap: Record<string, string> = {
			image:    'image/jpeg',
			video:    'video/mp4',
			audio:    'audio/ogg; codecs=opus',
			document: 'application/octet-stream',
			sticker:  'image/webp',
		};

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				let method: IHttpRequestMethods = 'GET';
				let endpoint = '';
				let body: Record<string, unknown> | undefined;

				const instId = () => this.getNodeParameter('instanceId', i) as string;

				// ── Instance ──────────────────────────────────
				if (resource === 'instance') {
					switch (operation) {
						case 'list':
							endpoint = '/instances';
							break;
						case 'get':
							endpoint = `/instances/${instId()}`;
							break;
						case 'create':
							method = 'POST';
							endpoint = '/instances';
							body = { name: this.getNodeParameter('instanceName', i) };
							break;
						case 'delete':
							method = 'DELETE';
							endpoint = `/instances/${instId()}`;
							break;
						case 'connect':
							method = 'POST';
							endpoint = `/instances/${instId()}/connect`;
							break;
						case 'disconnect':
							method = 'POST';
							endpoint = `/instances/${instId()}/disconnect`;
							break;
						case 'logout':
							method = 'POST';
							endpoint = `/instances/${instId()}/logout`;
							break;
						case 'getStatus':
							endpoint = `/instances/${instId()}/status`;
							break;
						case 'pairCode':
							method = 'POST';
							endpoint = `/instances/${instId()}/pair-code`;
							body = { phone: this.getNodeParameter('pairPhone', i) };
							break;
						case 'getSettings':
							endpoint = `/instances/${instId()}/settings`;
							break;
						case 'updateSettings':
							method = 'PATCH';
							endpoint = `/instances/${instId()}/settings`;
							// FIX: type:'json' params are already parsed — never call JSON.parse again
							body = this.getNodeParameter('settingsJson', i) as Record<string, unknown>;
							break;
						case 'setPresence':
							method = 'POST';
							endpoint = `/instances/${instId()}/presence`;
							body = {
								chat: this.getNodeParameter('presenceChat', i),
								type: this.getNodeParameter('presenceType', i),
							};
							break;
						case 'updateProfile':
							method = 'PATCH';
							endpoint = `/instances/${instId()}/profile`;
							body = { name: this.getNodeParameter('profileName', i) || undefined };
							break;
					}
				}

				// ── Message ───────────────────────────────────
				if (resource === 'message') {
					const id = instId();
					switch (operation) {
						case 'sendText':
							method = 'POST';
							endpoint = `/instances/${id}/messages/text`;
							body = {
								to:   this.getNodeParameter('to', i),
								text: this.getNodeParameter('text', i),
							};
							break;
						case 'sendMedia': {
							const mediaType = this.getNodeParameter('mediaType', i) as string;
							method = 'POST';
							endpoint = `/instances/${id}/messages/media`;
							body = {
								to:        this.getNodeParameter('to', i),
								type:      mediaType,
								data:      this.getNodeParameter('mediaData', i),
								// FIX: mime_type is required by the API; derived automatically from type
								mime_type: mimeTypeMap[mediaType] ?? 'application/octet-stream',
								caption:   this.getNodeParameter('caption', i) || undefined,
								file_name: this.getNodeParameter('fileName', i) || undefined,
							};
							break;
						}
						case 'sendLocation':
							method = 'POST';
							endpoint = `/instances/${id}/messages/location`;
							body = {
								to:   this.getNodeParameter('to', i),
								// FIX: API expects lat/lng, not latitude/longitude
								lat:  this.getNodeParameter('latitude', i),
								lng:  this.getNodeParameter('longitude', i),
								name: this.getNodeParameter('locationName', i) || undefined,
							};
							break;
						case 'sendContact':
							method = 'POST';
							endpoint = `/instances/${id}/messages/contact`;
							body = {
								to: this.getNodeParameter('to', i),
								contacts: [{
									// FIX: API expects 'name', not 'display_name'
									name:  this.getNodeParameter('contactName', i),
									phone: this.getNodeParameter('contactPhone', i),
								}],
							};
							break;
						case 'sendReaction':
							method = 'POST';
							endpoint = `/instances/${id}/messages/reaction`;
							body = {
								to:         this.getNodeParameter('to', i),
								message_id: this.getNodeParameter('messageId', i),
								// FIX: API field is 'reaction', not 'emoji'
								reaction:   this.getNodeParameter('emoji', i),
							};
							break;
						case 'sendPoll':
							method = 'POST';
							endpoint = `/instances/${id}/messages/poll`;
							body = {
								to:       this.getNodeParameter('to', i),
								question: this.getNodeParameter('question', i),
								options:  (this.getNodeParameter('pollOptions', i) as string).split(',').map(s => s.trim()),
							};
							break;
						case 'sendBatch':
							method = 'POST';
							endpoint = `/instances/${id}/messages/batch`;
							// FIX: type:'json' param is already parsed — never call JSON.parse again
							body = { messages: this.getNodeParameter('batchMessages', i) };
							break;
						case 'markRead':
							method = 'POST';
							endpoint = `/instances/${id}/messages/read`;
							body = {
								chat:        this.getNodeParameter('to', i),
								message_ids: [this.getNodeParameter('messageId', i)],
							};
							break;
						case 'list':
							endpoint = `/instances/${id}/messages?chat=${encodeURIComponent(this.getNodeParameter('chatJid', i) as string)}`;
							break;
						case 'search':
							endpoint = `/instances/${id}/messages/search?q=${encodeURIComponent(this.getNodeParameter('searchQuery', i) as string)}`;
							break;
						case 'listScheduled':
							endpoint = `/instances/${id}/messages/scheduled`;
							break;
						case 'cancelScheduled':
							method = 'DELETE';
							endpoint = `/instances/${id}/messages/scheduled/${encodeURIComponent(this.getNodeParameter('messageId', i) as string)}`;
							break;
						case 'revoke':
							method = 'DELETE';
							endpoint = `/instances/${id}/messages/${encodeURIComponent(this.getNodeParameter('messageId', i) as string)}`;
							// FIX: API requires chat JID in the body to locate the message
							body = { to: this.getNodeParameter('to', i) };
							break;
					}
				}

				// ── Contact ───────────────────────────────────
				if (resource === 'contact') {
					const id = instId();
					switch (operation) {
						case 'check':
							method = 'POST';
							endpoint = `/instances/${id}/contacts/check`;
							body = {
								phones: (this.getNodeParameter('phones', i) as string).split(',').map(s => s.trim()),
							};
							break;
						case 'getInfo':
							endpoint = `/instances/${id}/contacts/${encodeURIComponent(this.getNodeParameter('jid', i) as string)}`;
							break;
						case 'getPicture':
							endpoint = `/instances/${id}/contacts/${encodeURIComponent(this.getNodeParameter('jid', i) as string)}/picture`;
							break;
					}
				}

				// ── Group ─────────────────────────────────────
				if (resource === 'group') {
					const id = instId();
					switch (operation) {
						case 'list':
							endpoint = `/instances/${id}/groups`;
							break;
						case 'create':
							method = 'POST';
							endpoint = `/instances/${id}/groups`;
							body = {
								name:         this.getNodeParameter('groupName', i),
								participants: (this.getNodeParameter('participants', i) as string).split(',').map(s => s.trim()),
							};
							break;
						case 'getInfo':
							endpoint = `/instances/${id}/groups/${encodeURIComponent(this.getNodeParameter('groupJid', i) as string)}`;
							break;
						case 'updateParticipants':
							method = 'POST';
							endpoint = `/instances/${id}/groups/${encodeURIComponent(this.getNodeParameter('groupJid', i) as string)}/participants`;
							body = {
								action:       this.getNodeParameter('participantAction', i),
								participants: (this.getNodeParameter('participants', i) as string).split(',').map(s => s.trim()),
							};
							break;
						case 'leave':
							method = 'DELETE';
							endpoint = `/instances/${id}/groups/${encodeURIComponent(this.getNodeParameter('groupJid', i) as string)}/leave`;
							break;
					}
				}

				// ── Chatwoot ──────────────────────────────────
				if (resource === 'chatwoot') {
					switch (operation) {
						case 'syncHistory':
							method = 'POST';
							endpoint = `/instances/${instId()}/chatwoot/sync`;
							break;
					}
				}

				// ── Execute request ───────────────────────────
				if (endpoint === '') {
					throw new NodeOperationError(this.getNode(), `Unknown operation: ${resource}/${operation}`, { itemIndex: i });
				}

				const options: IHttpRequestOptions = {
					method,
					url:     `${baseUrl}/v1${endpoint}`,
					headers: { 'X-API-Key': apiKey },
					json:    true,
				};

				if (body !== undefined) {
					options.body = body as IHttpRequestOptions['body'];
				}

				const response = await this.helpers.httpRequest(options);

				// FIX: httpRequest with json:true returns the parsed body directly — no .data wrapper
				const json = typeof response === 'object' && response !== null
					? (response as IDataObject)
					: ({ result: response } as IDataObject);
				returnData.push({ json, pairedItem: { item: i } });

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
