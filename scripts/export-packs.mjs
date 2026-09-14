import fs from 'node:fs/promises';
import {packs} from '../packages/core/dist/index.js';
for(const pack of packs)await fs.writeFile(`design-packs/${pack.id}.json`,JSON.stringify(pack,null,2)+'\n');
