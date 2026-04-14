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

export class VelixTool implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Velix WhatsApp Tool',
		name: 'velixTool',
		icon: 'file:velix.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Send WhatsApp messages via Velix API. Use this tool to send text messages, images, reactions, locations, and contacts through WhatsApp. The instance ID is pre-configured — you only need to provide the recipient and message content.',
		defaults: { name: 'Velix WhatsApp Tool' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'velixApi',
				required: true,
			},
		],
		properties: [
			// ── Instance ID (fixed config, not for the AI to decide) ──
			{
				displayName: 'Instance ID',
				name: 'instanceId',
				type: 'string',
				required: true,
				default: '',
				description: 'The UUID of the WhatsApp instance to use. Find this in the Velix admin panel under Instances. Example: 93d05bc1-abcd-1234-ef56-789012345678. This is a fixed configuration — the AI agent does not need to change it.',
			},

			// ── Operation ────────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Send Text',
						value: 'sendText',
						description: 'Send a plain text message to a WhatsApp contact or group',
						action: 'Send a text message via WhatsApp',
					},
					{
						name: 'Send Image (URL)',
						value: 'sendImageUrl',
						description: 'Send an image from a public URL to a WhatsApp contact or group',
						action: 'Send an image via URL through WhatsApp',
					},
					{
						name: 'Send Reaction',
						value: 'sendReaction',
						description: 'React to a message with an emoji (e.g. thumbs up, heart)',
						action: 'React to a WhatsApp message with an emoji',
					},
					{
						name: 'Send Location',
						value: 'sendLocation',
						description: 'Send a geographic location pin to a WhatsApp contact or group',
						action: 'Send a location pin via WhatsApp',
					},
					{
						name: 'Send Contact',
						value: 'sendContact',
						description: 'Share a contact card (name + phone number) via WhatsApp',
						action: 'Send a contact card via WhatsApp',
					},
					{
						name: 'Set Presence',
						value: 'setPresence',
						description: 'Show "typing..." or "recording audio..." indicator to a contact. Use this BEFORE sending a message for a natural experience.',
						action: 'Show typing or recording indicator',
					},
				],
				default: 'sendText',
				description: 'The action to perform. Most common: "sendText" to send a message, "setPresence" to show typing before sending.',
			},

			// ── Recipient (for all except setPresence) ───────
			{
				displayName: 'Recipient (JID)',
				name: 'to',
				type: 'string',
				required: true,
				default: '',
				placeholder: '5511999990001@s.whatsapp.net',
				description: 'The WhatsApp ID of the recipient. For individual contacts, use the phone number (country code + number) followed by @s.whatsapp.net. Example: 5511999990001@s.whatsapp.net. For groups, use the group ID followed by @g.us. Example: 120363012345678901@g.us.',
				displayOptions: {
					hide: { operation: ['setPresence'] },
				},
			},

			// ── Send Text fields ─────────────────────────────
			{
				displayName: 'Message Text',
				name: 'text',
				type: 'string',
				typeOptions: { rows: 4 },
				required: true,
				default: '',
				placeholder: 'Hello! How can I help you today?',
				description: 'The text content of the message. Supports WhatsApp formatting: *bold*, _italic_, ~strikethrough~, ```monospace```. Can include emojis and line breaks.',
				displayOptions: { show: { operation: ['sendText'] } },
			},

			// ── Send Image URL fields ────────────────────────
			{
				displayName: 'Image URL',
				name: 'imageUrl',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'https://example.com/image.jpg',
				description: 'A publicly accessible URL of the image to send. Supported formats: JPEG, PNG, GIF, WebP. The URL must be reachable from the server.',
				displayOptions: { show: { operation: ['sendImageUrl'] } },
			},
			{
				displayName: 'Caption',
				name: 'caption',
				type: 'string',
				default: '',
				placeholder: 'Check out this image!',
				description: 'Optional text caption displayed below the image. Supports WhatsApp formatting.',
				displayOptions: { show: { operation: ['sendImageUrl'] } },
			},

			// ── Send Reaction fields ─────────────────────────
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'string',
				required: true,
				default: '',
				placeholder: '3EB0A0B0C1D2E3F4A5B6',
				description: 'The ID of the message to react to. You get this from incoming webhook events in the "id" field of a received message.',
				displayOptions: { show: { operation: ['sendReaction'] } },
			},
			{
				displayName: 'Emoji',
				name: 'emoji',
				type: 'string',
				required: true,
				default: '',
				placeholder: '👍',
				description: 'The emoji to react with. Use a single emoji character like 👍, ❤️, 😂, 🙏, 🎉. Send an empty string to remove a previous reaction.',
				displayOptions: { show: { operation: ['sendReaction'] } },
			},

			// ── Send Location fields ─────────────────────────
			{
				displayName: 'Latitude',
				name: 'latitude',
				type: 'number',
				required: true,
				default: 0,
				placeholder: '-23.5505',
				description: 'Geographic latitude in decimal degrees. Example: -23.5505 for São Paulo.',
				displayOptions: { show: { operation: ['sendLocation'] } },
			},
			{
				displayName: 'Longitude',
				name: 'longitude',
				type: 'number',
				required: true,
				default: 0,
				placeholder: '-46.6333',
				description: 'Geographic longitude in decimal degrees. Example: -46.6333 for São Paulo.',
				displayOptions: { show: { operation: ['sendLocation'] } },
			},
			{
				displayName: 'Location Name',
				name: 'locationName',
				type: 'string',
				default: '',
				placeholder: 'Paulista Avenue',
				description: 'Optional name displayed on the location pin in WhatsApp.',
				displayOptions: { show: { operation: ['sendLocation'] } },
			},

			// ── Send Contact fields ──────────────────────────
			{
				displayName: 'Contact Name',
				name: 'contactName',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'John Smith',
				description: 'Full name of the contact to share.',
				displayOptions: { show: { operation: ['sendContact'] } },
			},
			{
				displayName: 'Contact Phone',
				name: 'contactPhone',
				type: 'string',
				required: true,
				default: '',
				placeholder: '+5511999990001',
				description: 'Phone number of the contact in international format with + prefix. Example: +5511999990001.',
				displayOptions: { show: { operation: ['sendContact'] } },
			},

			// ── Set Presence fields ──────────────────────────
			{
				displayName: 'Chat JID',
				name: 'presenceChat',
				type: 'string',
				required: true,
				default: '',
				placeholder: '5511999990001@s.whatsapp.net',
				description: 'The WhatsApp ID of the chat where the typing/recording indicator will appear. Same format as Recipient: phone@s.whatsapp.net for individuals, groupid@g.us for groups.',
				displayOptions: { show: { operation: ['setPresence'] } },
			},
			{
				displayName: 'Presence Type',
				name: 'presenceType',
				type: 'options',
				options: [
					{ name: 'Typing', value: 'typing', description: 'Shows "typing..." to the contact' },
					{ name: 'Recording Audio', value: 'recording', description: 'Shows "recording audio..." to the contact' },
					{ name: 'Paused (Stop)', value: 'paused', description: 'Clears the typing/recording indicator' },
				],
				default: 'typing',
				description: 'What indicator to show. Use "typing" before sending a text, "recording" before sending audio, and "paused" to clear the indicator after sending.',
				displayOptions: { show: { operation: ['setPresence'] } },
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const credentials = await this.getCredentials('velixApi');
		const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');
		const apiKey = credentials.apiKey as string;
		const returnData: INodeExecutionData[] = [];
		const items = this.getInputData();

		for (let i = 0; i < items.length; i++) {
			try {
				const instanceId = this.getNodeParameter('instanceId', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				let method: IHttpRequestMethods = 'POST';
				let endpoint = '';
				let body: Record<string, unknown> | undefined;

				switch (operation) {
					case 'sendText':
						endpoint = `/instances/${instanceId}/messages/text`;
						body = {
							to: this.getNodeParameter('to', i),
							text: this.getNodeParameter('text', i),
						};
						break;

					case 'sendImageUrl': {
						endpoint = `/instances/${instanceId}/messages/media`;
						const imageUrl = this.getNodeParameter('imageUrl', i) as string;
						// Download the image and convert to base64
						const imgResponse = await this.helpers.httpRequest({
							method: 'GET',
							url: imageUrl,
							encoding: 'arraybuffer',
							returnFullResponse: true,
						} as IHttpRequestOptions);
						const b64 = Buffer.from(imgResponse.body as Buffer).toString('base64');
						body = {
							to: this.getNodeParameter('to', i),
							type: 'image',
							data: b64,
							mime_type: (imgResponse.headers?.['content-type'] as string) || 'image/jpeg',
							caption: this.getNodeParameter('caption', i) || undefined,
						};
						break;
					}

					case 'sendReaction':
						endpoint = `/instances/${instanceId}/messages/reaction`;
						body = {
							to: this.getNodeParameter('to', i),
							message_id: this.getNodeParameter('messageId', i),
							reaction: this.getNodeParameter('emoji', i),
						};
						break;

					case 'sendLocation':
						endpoint = `/instances/${instanceId}/messages/location`;
						body = {
							to: this.getNodeParameter('to', i),
							lat: this.getNodeParameter('latitude', i),
							lng: this.getNodeParameter('longitude', i),
							name: this.getNodeParameter('locationName', i) || undefined,
						};
						break;

					case 'sendContact':
						endpoint = `/instances/${instanceId}/messages/contact`;
						body = {
							to: this.getNodeParameter('to', i),
							contacts: [{
								name: this.getNodeParameter('contactName', i),
								phone: this.getNodeParameter('contactPhone', i),
							}],
						};
						break;

					case 'setPresence':
						endpoint = `/instances/${instanceId}/presence`;
						body = {
							to: this.getNodeParameter('presenceChat', i),
							type: this.getNodeParameter('presenceType', i),
						};
						break;

					default:
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: i });
				}

				const options: IHttpRequestOptions = {
					method,
					url: `${baseUrl}/v1${endpoint}`,
					headers: { 'X-API-Key': apiKey },
					json: true,
				};

				if (body !== undefined) {
					options.body = body as IHttpRequestOptions['body'];
				}

				const response = await this.helpers.httpRequest(options);
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
