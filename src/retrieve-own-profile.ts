/* eslint-disable @typescript-eslint/no-use-before-define */

import { getConnection, logBeforeTimeout } from '@firestone-hs/aws-lambda-utils';
import { logger } from '@firestone-hs/aws-lambda-utils/dist/services/logger';
import { ServerlessMysql } from 'serverless-mysql';
import { Profile } from './public-api';

// This example demonstrates a NodeJS 8.10 async handler[1], however of course you could use
// the more traditional callback-style handler.
// [1]: https://aws.amazon.com/blogs/compute/node-js-8-10-runtime-now-available-in-aws-lambda/
export default async (event, context): Promise<any> => {
	const cleanup = logBeforeTimeout(context);
	logger.log('received message', event);
	logger.log('with context', context);

	
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
	logger.log('will process', message);

	const token = message.token;
	logger.debug('token', token);

	const mysql = await getConnection();
	const existingProfile = await getExistingProfile(mysql, 'daedin');
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
	return existingProfile[0]?.profile ? JSON.parse(existingProfile[0].profile) : {};
};
