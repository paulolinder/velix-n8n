import {
	IDataObject,
	IWebhookFunctions,
	IWebhookResponseData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';

export class VelixTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Velix Trigger',
		name: 'velixTrigger',
		icon: 'file:velix.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Receives webhook events from Velix WhatsApp API',
		defaults: { name: 'Velix Trigger' },
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'velix-webhook',
			},
		],
		properties: [
			{
				displayName: 'Event Filter',
				name: 'event',
				type: 'options',
				options: [
					{ name: 'All Events', value: '*' },
					{ name: 'Message Received', value: 'messages.received' },
					{ name: 'Message Sent', value: 'messages.sent' },
					{ name: 'Instance Connected', value: 'instance.connected' },
					{ name: 'Instance Disconnected', value: 'instance.disconnected' },
					{ name: 'Instance Logged Out', value: 'instance.logged_out' },
					{ name: 'Instance Paired', value: 'instance.paired' },
					{ name: 'Receipt Delivered', value: 'receipts.delivered' },
					{ name: 'Receipt Read', value: 'receipts.read' },
				],
				default: 'messages.received',
				description: 'Which event type to listen for. Configure your Velix instance webhook URL to point at this trigger.',
			},
			{
				displayName: 'Instance ID Filter',
				name: 'instanceFilter',
				type: 'string',
				default: '',
				description: 'Only trigger for this instance ID (leave empty for all instances)',
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData() as IDataObject;
		const eventFilter = this.getNodeParameter('event') as string;
		const instanceFilter = this.getNodeParameter('instanceFilter') as string;

		// Filter by event type.
		const eventType = body.event as string | undefined;
		if (eventFilter !== '*' && eventType !== eventFilter) {
			return { noWebhookResponse: true };
		}

		// Filter by instance ID.
		if (instanceFilter && body.instance_id !== instanceFilter) {
			return { noWebhookResponse: true };
		}

		return {
			workflowData: [
				this.helpers.returnJsonArray(body),
			],
		};
	}
}
