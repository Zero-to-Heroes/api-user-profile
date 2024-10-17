/* eslint-disable @typescript-eslint/no-use-before-define */

import { getConnection, validateFirestoneToken } from '@firestone-hs/aws-lambda-utils';
import { ServerlessMysql } from 'serverless-mysql';
import { Profile, ProfileUpdateInput } from './public-api';

// This example demonstrates a NodeJS 8.10 async handler[1], however of course you could use
// the more traditional callback-style handler.
// [1]: https://aws.amazon.com/blogs/compute/node-js-8-10-runtime-now-available-in-aws-lambda/
export default async (event, context): Promise<any> => {
	const events: readonly ProfileUpdateInput[] = (event.Records as any[])
		.map((event) => JSON.parse(event.body))
		.reduce((a, b) => a.concat(b), []);
	console.debug('processing', events.length, 'events');

	const validationEvents = await Promise.all(events.map((ev) => validateEvent(ev)));
	const validEvents = validationEvents.filter((ev) => ev);
	console.debug('validated', validEvents.length, 'events');

	// Don't use s3 to store the info, as we need the shareAlias
	// We could have a mix s3 + sql, but that's a bit more complex and probably not useful right now
	const mysql = await getConnection();
	for (const event of validEvents) {
		const existingProfile = await getExistingProfile(mysql, event?.username);
		const newProfile = mergeProfiles(existingProfile, event.message);
		await updateProfile(mysql, event.username, newProfile);
	}
	await mysql.end();
	return { statusCode: 200, body: '' };
};

const getExistingProfile = async (mysql: ServerlessMysql, userName: string): Promise<Profile> => {
	const existingProfileSql = await mysql.query('SELECT * FROM user_profile WHERE userName = ?', [userName]);
	return existingProfileSql[0]?.profile ? JSON.parse(existingProfileSql[0].profile) : {};
};

const mergeProfiles = (existingProfile: Profile, newProfile: ProfileUpdateInput): Profile => {
	const result: ProfileUpdateInput = {
		...existingProfile,
		...newProfile,
	};
	delete result.jwt;
	return result;
};

const updateProfile = async (mysql: ServerlessMysql, userName: string, profile: Profile): Promise<void> => {
	await mysql.query(
		'INSERT INTO user_profile (userName, profile) VALUES (?, ?) ON DUPLICATE KEY UPDATE profile = ?',
		[userName, JSON.stringify(profile), JSON.stringify(profile)],
	);
};

const validateEvent = async (
	message: ProfileUpdateInput,
): Promise<{ message: ProfileUpdateInput; username: string } | null> => {
	const token = message.jwt;
	if (!token) {
		return null;
	}
	let userName = null;
	try {
		const validationResult = await validateFirestoneToken(token);
		if (!validationResult?.username) {
			return null;
		}
		userName = validationResult.username;
	} catch (e) {
		console.log('expired token', token);
		return null;
	}

	return { message, username: userName };
};
