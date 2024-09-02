import {INodeProperties} from 'n8n-workflow';

export const DEBUG = 'DEBUG';
export const ERROR = 'ERROR';
export const INFO = 'INFO';
export const WARN = 'WARN';

const logOptions = [
  {
    name: DEBUG,
    value: DEBUG,
  },
  {
    name: INFO,
    value: INFO,
  },
  {
    name: WARN,
    value: WARN,
  },
  {
    name: ERROR,
    value: ERROR,
  },
];

const US = 'datadoghq.com';
const EU = 'datadoghq.eu';

const siteOptions = [
  {
    name: US,
    value: 'datadoghq.com',
  },
  {
    name: EU,
    value: 'datadoghq.eu',
  },
];

export const CONDITION = 'condition';
export const FAILURE = 'failure';
export const LOGLEVEL = 'logLevel';
export const MESSAGE = 'message';
export const SERVICE_NAME = 'serviceName';
export const SITE = 'site';
export const SUCCESS = 'success';
export const TAGS = 'tags';

export const datadogOperations: INodeProperties[] = [
  {
    displayName: 'Datadog Site',
    default:  US,
    name: SITE,
    required: true,
    type: 'options',
    options: siteOptions,
  },
  {
    displayName: 'Condition',
    default: '',
    description: 'Condition that will be evaluated to determine the log message and log level',
    name: CONDITION,
    required: true,
    type: 'filter',
  },
  {
    displayName: 'Success',
    name: SUCCESS,
    type: 'collection',
    default: {
      message: '',
      logLevel: INFO,
    },
    options: [{
      displayName: 'Message',
      default: '',
      description: 'Message that will be logged to datadog in case the condition is met',
      name: MESSAGE,
      type: 'string',
    }, {
      displayName: 'Log Level',
      default: INFO,
      description: 'Log level in case the condition is met',
      name: LOGLEVEL,
      options: logOptions,
      type: 'options'
    }],
  },
  {
    displayName: 'Failure',
    name: FAILURE,
    type: 'collection',
    default: {
      message: '',
      logLevel: ERROR,
    },
    options: [{
      displayName: 'Message',
      default: '',
      description: 'Message that will be logged to datadog in case the condition is not met',
      name: MESSAGE,
      type: 'string',
    }, {
      displayName: 'Log Level',
      default: ERROR,
      description: 'Log level in case the condition is not met',
      name: LOGLEVEL,
      options: logOptions,
      type: 'options'
    }],
  },
  {
    displayName: 'Tags',
    default: '',
    description: 'Tags that will be added to the log message',
    name: TAGS,
    placeholder: 'env:test,service:my-service',
    type: 'string'
  },
  {
    displayName: 'Service Name',
    default: '',
    description: 'Service name that will be added to the log message',
    name: SERVICE_NAME,
    type: 'string',
    required: true,
  }
];
