import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';
import {
    CONDITION,
    datadogOperations,
    ERROR,
    FAILURE,
    INFO,
    LOGLEVEL,
    MESSAGE,
    SERVICE_NAME,
    SITE,
    SUCCESS,
    TAGS,
    WARN
} from "./Datadog.operations";

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
            ...datadogOperations
        ],
        version: 1,
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData = [];

        let item: INodeExecutionData;

        for (let index = 0; index < items.length; index++) {
            const site = this.getNodeParameter(SITE, index, '') as string;
            const workflowId = this.getWorkflow().id as string;
            const executionId = this.getExecutionId() as string;
            const successMessage = this.getNodeParameter(`${SUCCESS}.${MESSAGE}`, index, '') as string;
            const successLoglevel = this.getNodeParameter(`${SUCCESS}.${LOGLEVEL}`, index, '') as string;
            const failureMessage = this.getNodeParameter(`${FAILURE}.${MESSAGE}`, index, '') as string;
            const failureLoglevel = this.getNodeParameter(`${FAILURE}.${LOGLEVEL}`, index, '') as string;
            const condition = this.getNodeParameter(CONDITION, index, false, {extractValue: true}) as boolean;
            const tags = this.getNodeParameter(TAGS, index, '') as string;
            const serviceName = this.getNodeParameter(SERVICE_NAME, index, '') as string;
            const host = this.getInstanceBaseUrl() as string;

            item = items[index];

            const level = condition ? successLoglevel : failureLoglevel;
            const payload = {
                '@timestamp': new Date().toISOString(),
                '@version': 1,
                ddsource: serviceName.trim(),
                service: serviceName.trim(),
                host: host,
                path: `${host}/workflow/${workflowId}/executions/${executionId}`.replace(/(?<!https?:)\/\//g, '/'),
                ddtags: tags,
                message: condition ? successMessage : failureMessage,
                dd: {
                    service: serviceName.trim(),
                    workflowId: workflowId,
                    executionId: executionId,
                },
                level: level,
                level_value: level === ERROR ? 40000 : level === WARN ? 30000 : level === INFO ? 20000 : 0
            }

            const options: any = {
                headers: {
                    'Accept': 'application/json'
                },
                method: 'POST',
                body: payload,
                uri: `https://http-intake.logs.${site}/api/v2/logs`,
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
