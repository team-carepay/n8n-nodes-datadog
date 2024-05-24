import {IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription,} from 'n8n-workflow';

export class LogToDatadog implements INodeType {
  description: INodeTypeDescription = {
    credentials: [
      {
        name: 'datadogApi',
        required: true,
      },
    ],
    description: 'Log messages to Datadog',
    displayName: 'Log messages to Datadog',
    defaults: {
      name: 'Log to Datadog',
    },
    group: ['transform'],
    inputs: ['main'],
    name: 'logToDatadog',
    outputs: ['main'],
    properties: [
      {
        displayName: 'Workflow Name',
        description: 'The workflow name that will be added to the log message for tracing',
        default: '={{ $workflow.id }}',
        name: 'workflow',
        required: true,
        type: 'string'
      },
      {
        displayName: 'Execution ID',
        description: 'The execution ID that will be added to the log message for tracing',
        default: '={{ $execution.id }}',
        name: 'executionId',
        required: true,
        type: 'string'
      },
      {
        displayName: 'Success Message',
        default: '',
        description: 'Message that will be logged to datadog in case the condition is met',
        name: 'successMessage',
        required: true,
        type: 'string',
      },
      {
        displayName: 'Success Log Level',
        default: 'INFO',
        description: 'Log level in case the condition is met',
        name: 'successLoglevel',
        options: [
          {
            name: 'DEBUG',
            value: 'DEBUG',
          },
          {
            name: 'INFO',
            value: 'INFO',
          },
          {
            name: 'WARN',
            value: 'WARN',
          },
          {
            name: 'ERROR',
            value: 'ERROR',
          },
        ],
        type: 'options',
      },
      {
        displayName: 'Failure Message',
        default: '',
        description: 'Message that will be logged to datadog in case the condition is not met',
        name: 'failureMessage',
        required: true,
        type: 'string',
      },
      {
        displayName: 'Failure Log Level',
        default: 'ERROR',
        description: 'Log level in case the condition is not met',
        name: 'failureLoglevel',
        options: [
          {
            name: 'DEBUG',
            value: 'DEBUG',
          },
          {
            name: 'INFO',
            value: 'INFO',
          },
          {
            name: 'WARN',
            value: 'WARN',
          },
          {
            name: 'ERROR',
            value: 'ERROR',
          },
        ],
        type: 'options',
      },
      {
        displayName: 'Condition',
        default: '',
        description: 'Condition that will be evaluated to determine the log message and log level',
        name: 'condition',
        required: true,
        type: 'string',
      },
      {
        displayName: 'Tags',
        default: '',
        description: 'Tags that will be added to the log message',
        name: 'tags',
        placeholder: 'tag1:value1,tag2:value2',
        required: true,
        type: 'string'
      },
      {
        displayName: 'Service Name',
        default: '',
        description: 'Service name that will be added to the log message',
        name: 'serviceName',
        type: 'string',
      },
      {
        displayName: 'Host Name',
        default: '',
        description: 'Host name that will be added to the log message',
        name: 'hostName',
        type: 'string',
      }
    ],
    version: 1,
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData = [];

    let item: INodeExecutionData;

    for (let index = 0; index < items.length; index++) {
      const workflow = this.getNodeParameter('workflow', index, '') as string;
      const executionId = this.getNodeParameter('executionId', index, '') as string;
      const successMessage = this.getNodeParameter('successMessage', index, '') as string;
      const successLoglevel = this.getNodeParameter('successLoglevel', index, '') as string;
      const failureMessage = this.getNodeParameter('failureMessage', index, '') as string;
      const failureLoglevel = this.getNodeParameter('failureLoglevel', index, '') as string;
      const condition = this.getNodeParameter('condition', index, '') as boolean;
      const tags = this.getNodeParameter('tags', index, '') as string;
      const serviceName = this.getNodeParameter('serviceName', index, '') as string;
      const hostName = this.getNodeParameter('hostName', index, '') as string;

      item = items[index];

      const level = condition ? successLoglevel : failureLoglevel;
      const payload = {
        '@timestamp': new Date().toISOString(),
        '@version': 1,
        ddsource: serviceName,
        service: serviceName,
        workflow: workflow,
        hostname: hostName,
        ddtags: tags,
        executionId: executionId,
        message: condition ? successMessage : failureMessage,
        dd: {
          service: serviceName
        },
        level: level,
        level_value: level === 'ERROR' ? 40000 : level === 'WARN' ? 30000 : level === 'INFO' ? 20000 : 0,
      }

      const options: any = {
        headers: {
          'Accept': 'application/json'
        },
        method: 'POST',
        body: payload,
        uri: `https://http-intake.logs.datadoghq.com/api/v2/logs`,
        json: true,
      };
      await this.helpers.requestWithAuthentication.call(this, 'datadogApi', options);

      if (condition || this.continueOnFail()) {
        returnData.push(item);
      }
    }

    return [this.helpers.returnJsonArray(returnData)];
  }
}
