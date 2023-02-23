import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { EventEmitter } from 'events';

export default class GoogleAuth extends EventEmitter {
    private readonly SCOPES = ['https://www.googleapis.com/auth/webmasters'];
    public static readonly TOKEN_PATH = path.resolve(
        __dirname,
        '../../token.json'
    );
    private readonly CREDENTIALS_PATH = path.resolve(
        __dirname,
        '../../credentials.json'
    );

    public async getAuth() {
        const credentials = await fs.promises
            .readFile(this.CREDENTIALS_PATH, 'utf-8')
            .then((content) => JSON.parse(content))
            .catch(() => null);

        if (!credentials) {
            console.error('No credentials found at: ' + this.CREDENTIALS_PATH);
            process.exit(1);
        }

        const oAuth2Client = new google.auth.OAuth2(
            credentials.web.client_id,
            credentials.web.client_secret,
            credentials.web.redirect_uris[0]
        );

        const token = await fs.promises
            .readFile(GoogleAuth.TOKEN_PATH, 'utf-8')
            .then((text) => JSON.parse(text))
            .catch(async () => await this.getAccessToken(oAuth2Client));

        if (!token) return undefined;

        oAuth2Client.setCredentials(token);

        return oAuth2Client;
    }

    public setCode(code: string) {
        this.emit('code', code);
    }

    private async getAccessToken(oAuth2Client: OAuth2Client) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: this.SCOPES
        });

        this.emit('authUrl', authUrl);

        const code: string = await new Promise((resolve) => {
            const listener = (code: string) => {
                this.removeListener('code', listener);
                resolve(code);
            };
            this.on('code', listener);
        });

        const token = await new Promise((resolve) => {
            oAuth2Client.getToken(code, async (err, token) => {
                if (err) {
                    console.error('Error retrieving access token', err);
                    resolve(null);
                }
                await fs.promises.writeFile(
                    GoogleAuth.TOKEN_PATH,
                    JSON.stringify(token)
                );
                resolve(token);
            });
        });

        return token;
    }
}
