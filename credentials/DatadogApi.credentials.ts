import {IAuthenticateGeneric, ICredentialType, INodeProperties,} from 'n8n-workflow';

export class DatadogApi implements ICredentialType {
  name = 'datadogApi';
  displayName = 'Datadog API';
  properties: INodeProperties[] = [
    {
      displayName: 'DD-API-KEY',
      name: 'apiKey',
      type: 'string',
      typeOptions: {password: true},
      default: '',
    }
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'DD-API-KEY': '={{$credentials.apiKey}}',
      },
    },
  };
}
