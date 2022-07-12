import {
  ConnectorError,
  ConnectorErrorCodes,
  ConnectorMetadata,
  SmsMessageTypes,
  SmsSendMessageFunction,
  SmsSendTestMessageFunction,
  ValidateConfig,
  SmsConnector,
  GetConnectorConfig,
} from '@logto/connector-types';
import { assert } from '@silverhand/essentials';
import got, { HTTPError } from 'got';

import { defaultMetadata, endpoint } from './constant';
import { twilioSmsConfigGuard, TwilioSmsConfig, PublicParameters } from './types';

export default class TwilioSmsConnector implements SmsConnector {
  public metadata: ConnectorMetadata = defaultMetadata;

  constructor(public readonly getConfig: GetConnectorConfig<TwilioSmsConfig>) {}

  public validateConfig: ValidateConfig = async (config: unknown) => {
    const result = twilioSmsConfigGuard.safeParse(config);

    if (!result.success) {
      throw new ConnectorError(ConnectorErrorCodes.InvalidConfig, result.error);
    }
  };

  public sendMessage: SmsSendMessageFunction = async (address, type, data) => {
    const smsConfig = await this.getConfig(this.metadata.id);
    await this.validateConfig(smsConfig);

    return this.sendMessageBy(smsConfig, address, type, data);
  };

  public sendTestMessage: SmsSendTestMessageFunction = async (phone, type, data, config) => {
    await this.validateConfig(config);

    return this.sendMessageBy(config as TwilioSmsConfig, phone, type, data);
  };

  private readonly sendMessageBy = async (
    config: TwilioSmsConfig,
    phone: string,
    type: keyof SmsMessageTypes,
    data: SmsMessageTypes[typeof type]
  ) => {
    const { accountSID, authToken, fromMessagingServiceSID, templates } = config;
    const template = templates.find((template) => template.usageType === type);

    assert(
      template,
      new ConnectorError(
        ConnectorErrorCodes.TemplateNotFound,
        `Cannot find template for type: ${type}`
      )
    );

    const parameters: PublicParameters = {
      To: phone,
      MessagingServiceSid: fromMessagingServiceSID,
      Body:
        typeof data.code === 'string'
          ? template.content.replace(/{{code}}/g, data.code)
          : template.content,
    };

    try {
      return await got.post(endpoint.replace(/{{accountSID}}/g, accountSID), {
        headers: {
          Authorization:
            'Basic ' + Buffer.from([accountSID, authToken].join(':')).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(parameters).toString(),
      });
    } catch (error: unknown) {
      if (error instanceof HTTPError) {
        const {
          response: { body: rawBody },
        } = error;
        assert(
          typeof rawBody === 'string',
          new ConnectorError(ConnectorErrorCodes.InvalidResponse)
        );

        throw new ConnectorError(ConnectorErrorCodes.General, rawBody);
      }

      throw error;
    }
  };
}
