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
	logger.debug('received message', event);

	const userName: string = event.rawPath.split('/').pop();
	if (!userName?.length) {
		logger.debug('no username in event', event);
	}

	const mysql = await getConnection();
	const existingProfile = await getExistingProfile(mysql, userName.toLowerCase());

	await mysql.end();
	cleanup();
	return { statusCode: 200, body: JSON.stringify(existingProfile) };
};

const getExistingProfile = async (mysql: ServerlessMysql, userName: string): Promise<Profile> => {
	const existingProfile = await mysql.query('SELECT * FROM user_profile WHERE shareAlias = ?', [userName]);
	logger.debug('existing profile', existingProfile);
	return existingProfile[0]?.profile ? JSON.parse(existingProfile[0].profile) : {};
};
