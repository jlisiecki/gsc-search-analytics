import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const { FILTER_FILE, DATA_FILE } = process.env;

if (!FILTER_FILE || !DATA_FILE) throw new Error('Missing env vars');

let urls: string[];
if (FILTER_FILE.endsWith('.csv')) {
    urls = parse(
        readFileSync(resolve(__dirname, '../' + FILTER_FILE), 'utf-8'),
        {
            bom: true,
            columns: true
        }
    ).map((row: any) => row.Loc || row.url || row.href);
} else {
    urls = readFileSync(resolve(__dirname, '../' + FILTER_FILE), 'utf-8').split(
        /[\r\n\s]+/
    );
}

const data = parse(
    readFileSync(resolve(__dirname, '../' + DATA_FILE), 'utf-8'),
    {
        bom: true,
        columns: true
    }
).filter((row: any) => urls.includes(row.page));

const csv = stringify(data, { header: true });

writeFileSync(resolve(__dirname, '../filtered-' + DATA_FILE), csv);
