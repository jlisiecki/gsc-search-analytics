import 'dotenv/config';
import fetch from 'node-fetch';
import { AbortController } from 'node-abort-controller';
import GoogleAuth from './class/GoogleAuth';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs/promises';
import { unlinkSync } from 'fs';
import { DateTime } from 'luxon';
import express from 'express';
import open from 'open';

if (process.argv.includes('--logout')) {
    try {
        unlinkSync(GoogleAuth.TOKEN_PATH);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

/* config */
const siteUrl = process.env.SITE_URL || 'https://example.com/';
const dimensions = process.env.DIMENSIONS?.split(/\s*,\s*/).filter(
    (dimension) => ['country', 'device', 'page', 'query'].includes(dimension)
) || ['query', 'page', 'country', 'searchAppearance'];
let startDate =
    process.env.START_DATE || DateTime.local().minus({ days: 14 }).toISODate();
let endDate =
    process.env.END_DATE || DateTime.local().minus({ days: 7 }).toISODate();
/* end config */

const googleAuth = new GoogleAuth();

/* auth server */
const PORT = process.env.PORT || 5632;
const app = express();
app.get('/', (req, res) => {
    googleAuth.setCode(req.query.code as string);
    res.send('Success! You can close this window now.');
});
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
googleAuth.on('authUrl', (authUrl) => {
    open(authUrl).catch(() => {
        console.log(`Please visit this URL to authorize this app: ${authUrl}`);
    });
});
/* end auth server */

const rowLimit = 25000;

googleAuth.getAuth().then(async (auth) => {
    if (!auth) return;
    const token = (await auth.getAccessToken()).token || null;
    if (!token) return;
    const rows = [];

    for (let i = 0; true; i++) {
        console.log(
            `Requesting rows: ${rowLimit * i}-${rowLimit * (i + 1) - 1}`
        );
        const controller = new AbortController();
        const { signal } = controller;
        const timeout = setTimeout(controller.abort, 60000);
        const response = await fetch(
            `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
                siteUrl
            )}/searchAnalytics/query`,
            {
                signal,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    startDate,
                    type: 'web',
                    endDate,
                    dimensions,
                    rowLimit,
                    startRow: rowLimit * i
                })
            }
        )
            .then((res) => res.json())
            .catch((err) => ({
                error: {
                    code: 0,
                    message: err.message,
                    status: err.code
                }
            }));
        clearTimeout(timeout);
        if (response.rows && response.rows.length > 0)
            rows.push(
                ...response.rows.map((row: any) => {
                    const out: any = {};
                    dimensions.forEach((dimension, index) => {
                        out[dimension] = row.keys[index];
                    });

                    out.clicks = row.clicks;
                    out.impressions = row.impressions;
                    out.ctr = row.ctr;
                    out.position = row.position;

                    return out;
                })
            );
        else break;
    }

    const csv = stringify(rows, { header: true });

    await fs.writeFile(
        `./data-${encodeURIComponent(
            siteUrl.replace(/\W+/gi, '-').replace(/^-+/, '').replace(/-+$/, '')
        )}-${dimensions.join('-')}-${startDate}-${endDate}.csv`,
        csv
    );

    process.exit();
});
