/* eslint-disable @typescript-eslint/no-use-before-define */

import { getConnection, logBeforeTimeout, validateFirestoneToken } from '@firestone-hs/aws-lambda-utils';
import { logger } from '@firestone-hs/aws-lambda-utils/dist/services/logger';
import { ServerlessMysql } from 'serverless-mysql';
import { Profile, ProfileUpdateInput } from './public-api';

// This example demonstrates a NodeJS 8.10 async handler[1], however of course you could use
// the more traditional callback-style handler.
// [1]: https://aws.amazon.com/blogs/compute/node-js-8-10-runtime-now-available-in-aws-lambda/
export default async (event, context): Promise<any> => {
	const cleanup = logBeforeTimeout(context);
	logger.debug('received message', event);
	const message: ProfileUpdateInput = JSON.parse(event.body);
	logger.debug('will process', message);

	const token = message.jwt;
	logger.debug('token', token);
	const validationResult = await validateFirestoneToken(token);
	// const validationResult = message.isFirestoneToken
	// 	? await validateFirestoneToken(token)
	// 	: await validateOwToken(token);
	logger.debug('validation result', validationResult);
	if (!validationResult?.username) {
		cleanup();
		return {
			statusCode: 403,
			body: 'could not decrypt token ' + token,
		};
	}

	// Don't use s3 to store the info, as we need the shareAlias
	// We could have a mix s3 + sql, but that's a bit more complex and probably not useful right now
	const mysql = await getConnection();
	const existingProfile = await getExistingProfile(mysql, validationResult?.username);
	const newProfile = mergeProfiles(existingProfile, message);
	await updateProfile(mysql, validationResult?.username, newProfile);

	if (validationResult?.username === 'daedin') {
		logger.dumpBuffer();
	}

	await mysql.end();
	cleanup();
	return { statusCode: 200, body: '' };
};

const getExistingProfile = async (mysql: ServerlessMysql, userName: string): Promise<Profile> => {
	const existingProfileSql = await mysql.query('SELECT * FROM user_profile WHERE userName = ?', [userName]);
	logger.debug('existingProfileSql', existingProfileSql);
	return existingProfileSql[0]?.profile ? JSON.parse(existingProfileSql[0].profile) : {};
};

const mergeProfiles = (existingProfile: Profile, newProfile: ProfileUpdateInput): Profile => {
	const result: ProfileUpdateInput = {
		...existingProfile,
		...newProfile,
	};
	// if (result.shareAlias === 'daedin') {
	// console.debug('merged profile', existingProfile, newProfile, result);
	// }
	delete result.jwt;
	return result;
};

const updateProfile = async (mysql: ServerlessMysql, userName: string, profile: Profile): Promise<void> => {
	await mysql.query(
		'INSERT INTO user_profile (userName, profile) VALUES (?, ?) ON DUPLICATE KEY UPDATE profile = ?',
		[userName, JSON.stringify(profile), JSON.stringify(profile)],
	);
};
