/* eslint-disable @typescript-eslint/no-use-before-define */

import { getConnection, logBeforeTimeout } from '@firestone-hs/aws-lambda-utils';
import { logger } from '@firestone-hs/aws-lambda-utils/dist/services/logger';
import SecretsManager, { GetSecretValueRequest, GetSecretValueResponse } from 'aws-sdk/clients/secretsmanager';
import { JwtPayload, decode, verify } from 'jsonwebtoken';
import { ServerlessMysql } from 'serverless-mysql';
import { Profile } from './public-api';

const secretsManager = new SecretsManager({ region: 'us-west-2' });

// This example demonstrates a NodeJS 8.10 async handler[1], however of course you could use
// the more traditional callback-style handler.
// [1]: https://aws.amazon.com/blogs/compute/node-js-8-10-runtime-now-available-in-aws-lambda/
export default async (event, context): Promise<any> => {
	const cleanup = logBeforeTimeout(context);

	const headers = {
		'Access-Control-Allow-Headers':
			'Accept,Accept-Language,Content-Language,Content-Type,Authorization,x-correlation-id,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
		'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT',
		'Access-Control-Allow-Origin': event.headers.Origin || event.headers.origin,
	};
	// Check if the event is a preflight request (CORS)
	if (event.requestContext.http?.method === 'OPTIONS') {
		cleanup();
		return {
			statusCode: 200,
			headers: headers,
		};
	}

	const message: { token: string } = JSON.parse(event.body);
	const token = message.token;
	const decoded = decode(token) as JwtPayload;
	const secretRequest: GetSecretValueRequest = {
		SecretId: 'sso',
	};
	const secret: SecretInfo = await getSecret(secretRequest);
	try {
		const valid = verify(token, secret.fsJwtTokenKey, {
			algorithms: ['HS256'],
		});

		if (!valid?.sub) {
			logger.warn('invalid token', token, decoded, message);
			cleanup();
			return {
				statusCode: 403,
				headers: headers,
			};
		}
	} catch (e) {
		logger.warn('invalid token', token, decoded, message);
		cleanup();
		return {
			statusCode: 403,
			headers: headers,
		};
	}

	const mysql = await getConnection();
	const existingProfile = await getExistingProfile(mysql, decoded.sub);
	await mysql.end();
	cleanup();
	return {
		statusCode: 200,
		headers: headers,
		body: JSON.stringify(existingProfile),
	};
};

const getExistingProfile = async (mysql: ServerlessMysql, userName: string): Promise<Profile> => {
	const existingProfile = await mysql.query('SELECT * FROM user_profile WHERE userName = ?', [userName]);
	logger.debug('existing profile', existingProfile);
	if (!existingProfile[0]?.profile?.length) {
		return {};
	}

	const profile = JSON.parse(existingProfile[0].profile);
	const ammeded: Profile = {
		...profile,
		shareAlias: existingProfile[0].shareAlias,
	};
	return ammeded;
};

const getSecret = (secretRequest: GetSecretValueRequest) => {
	return new Promise<SecretInfo>((resolve) => {
		secretsManager.getSecretValue(secretRequest, (err, data: GetSecretValueResponse) => {
			const secretInfo: SecretInfo = JSON.parse(data.SecretString);
			resolve(secretInfo);
		});
	});
};

interface SecretInfo {
	readonly clientId: string;
	readonly clientSecret: string;
	readonly fsJwtTokenKey: string;
}
