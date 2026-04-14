import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class VelixApi implements ICredentialType {
	name = 'velixApi';
	displayName = 'Velix API';
	documentationUrl = 'https://github.com/paulolinder/velix-api';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: '',
			placeholder: 'https://api.velix.dev',
			description: 'URL base da Velix API (sem /v1)',
			required: true,
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Chave de API gerada em POST /v1/auth/api-keys',
			required: true,
		},
	];
}
