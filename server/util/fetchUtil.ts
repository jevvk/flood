import axios, {AxiosError} from 'axios';
import fs from 'fs';
import path from 'path';

import {isAllowedPath} from './fileUtil';

export const fetchUrls = async (
  inputUrls: string[],
  cookies: {[domain: string]: string[]},
): Promise<{files: Buffer[]; urls: string[]}> => {
  const files: Buffer[] = [];
  const urls: string[] = [];

  await Promise.all(
    inputUrls.map(async (url) => {
      if (url.startsWith('http:') || url.startsWith('https:')) {
        const domain = url.split('/')[2];
        const headers = { 'Accept-Encoding': 'gzip, deflate' };
        
        if (cookies?.[domain]) {
          headers['Cookie'] = cookies[domain].join('; ').concat(';');
        }

        const file = await axios({
          method: 'GET',
          url,
          responseType: 'arraybuffer',
          decompress: true,
          headers: headers
        }).then(
          (res) => res.data,
          (e: AxiosError) => console.error(e),
        );

        if (file instanceof Buffer) {
          files.push(file);
        }

        return;
      }

      if (fs.existsSync(url) && isAllowedPath(path.resolve(url))) {
        try {
          files.push(await fs.promises.readFile(url));
          return;
        } catch {
          // do nothing.
        }
      }

      urls.push(url);
    }),
  );

  return {files, urls};
};
