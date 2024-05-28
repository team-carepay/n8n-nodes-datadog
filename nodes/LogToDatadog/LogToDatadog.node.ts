import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';

const logOptions = [
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
];

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
        icon: 'file:dd_logo_v_rgb.svg',
        name: 'logToDatadog',
        outputs: ['main'],
        properties: [
            {
                displayName: 'Condition',
                default: '',
                description: 'Condition that will be evaluated to determine the log message and log level',
                name: 'condition',
                required: true,
                type: 'filter',
            },
            {
                displayName: 'Success',
                name: 'success',
                type: 'collection',
                default: {
                    message: '',
                    logLevel: 'INFO',
                },
                options: [{
                    displayName: 'Message',
                    default: '',
                    description: 'Message that will be logged to datadog in case the condition is met',
                    name: 'message',
                    type: 'string',
                }, {
                    displayName: 'Log Level',
                    default: 'INFO',
                    description: 'Log level in case the condition is met',
                    name: 'logLevel',
                    options: logOptions,
                    type: 'options'
                }],
            },
            {
                displayName: 'Failure',
                name: 'failure',
                type: 'collection',
                default: {
                    message: '',
                    logLevel: 'INFO',
                },
                options: [{
                    displayName: 'Message',
                    default: '',
                    description: 'Message that will be logged to datadog in case the condition is not met',
                    name: 'message',
                    type: 'string',
                }, {
                    displayName: 'Log Level',
                    default: 'ERROR',
                    description: 'Log level in case the condition is not met',
                    name: 'logLevel',
                    options: logOptions,
                    type: 'options'
                }],
            },
            {
                displayName: 'Tags',
                default: '',
                description: 'Tags that will be added to the log message',
                name: 'tags',
                placeholder: 'env:test,service:my-service',
                type: 'string'
            },
            {
                displayName: 'Service Name',
                default: '',
                description: 'Service name that will be added to the log message',
                name: 'serviceName',
                type: 'string',
                required: true,
            }
        ],
        version: 1,
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData = [];

        let item: INodeExecutionData;

        for (let index = 0; index < items.length; index++) {
            const workflowId = this.getWorkflow().id as string;
            const executionId = this.getExecutionId() as string;
            const successMessage = this.getNodeParameter('success.message', index, '') as string;
            const successLoglevel = this.getNodeParameter('success.logLevel', index, '') as string;
            const failureMessage = this.getNodeParameter('failure.message', index, '') as string;
            const failureLoglevel = this.getNodeParameter('failure.logLevel', index, '') as string;
            const condition = this.getNodeParameter('condition', index, false, {extractValue: true}) as boolean;
            const tags = this.getNodeParameter('tags', index, '') as string;
            const serviceName = this.getNodeParameter('serviceName', index, '') as string;
            const host = this.getInstanceBaseUrl() as string;

            item = items[index];

            const level = condition ? successLoglevel : failureLoglevel;
            const payload = {
                '@timestamp': new Date().toISOString(),
                '@version': 1,
                ddsource: serviceName.trim(),
                service: serviceName.trim(),
                host: host,
                path: `/workflow/${workflowId}/executions/${executionId}`,
                ddtags: tags,
                message: condition ? successMessage : failureMessage,
                dd: {
                    service: serviceName.trim(),
                    workflowId: workflowId,
                    executionId: executionId,
                },
                level: level,
                level_value: level === 'ERROR' ? 40000 : level === 'WARN' ? 30000 : level === 'INFO' ? 20000 : 0
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
