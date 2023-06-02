/* eslint-disable @typescript-eslint/no-use-before-define */

import { getConnection, logBeforeTimeout } from '@firestone-hs/aws-lambda-utils';
import { logger } from '@firestone-hs/aws-lambda-utils/dist/services/logger';
import SecretsManager from 'aws-sdk/clients/secretsmanager';
import { ServerlessMysql } from 'serverless-mysql';
import { Profile } from './public-api';

const secretsManager = new SecretsManager({ region: 'us-west-2' });

// This example demonstrates a NodeJS 8.10 async handler[1], however of course you could use
// the more traditional callback-style handler.
// [1]: https://aws.amazon.com/blogs/compute/node-js-8-10-runtime-now-available-in-aws-lambda/
export default async (event, context): Promise<any> => {
	const cleanup = logBeforeTimeout(context);
	logger.debug('received message', event);
	logger.debug('with context', context);

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

	const message: { shareAlias: string } = JSON.parse(event.body);
	logger.debug('will process', message);

	const mysql = await getConnection();
	const existingProfile = await getSharedProfile(mysql, message.shareAlias);
	await mysql.end();
	cleanup();
	return {
		statusCode: 200,
		headers: headers,
		body: JSON.stringify(existingProfile),
	};
};

const getSharedProfile = async (mysql: ServerlessMysql, shareAlias: string): Promise<Profile> => {
	const existingProfile = await mysql.query('SELECT * FROM user_profile WHERE shareAlias = ?', [shareAlias]);
	logger.debug('existing shared profile', existingProfile);
	return existingProfile[0]?.profile ? JSON.parse(existingProfile[0].profile) : {};
};
