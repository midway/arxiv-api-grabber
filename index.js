import { read } from 'feed-reader'
import fs from 'fs';
import { stringify } from 'csv-stringify';
import yargs from 'yargs';

const argv = yargs(process.argv).argv;

const filename = argv.query.replace(' ', '_') + '.csv';
const writableStream = fs.createWriteStream(filename);
const columns = [
    'title',
    'link',
    'id',
    'description',
    'published',
    'author_count',
    'authors',
    'primary_category'
];

const sleep = (milliseconds) => {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

const getFeedData = async (url) => {
    try {
      console.log(`Get feed data from ${url}`)
      const data = await read(url)
      return data
    } catch (err) {
      console.trace(err)
    }
  }

const stringifier = stringify({header: true, columns });
  
let morePages = true;
let start = argv.start;
let consecutiveFailures = 0;

do {
  const url = `http://export.arxiv.org/api/query?search_query=${argv.query}&start=${start}&max_results=50`
  const feedData = await getFeedData(url);
  console.log(`Total Results: ${feedData.totalResults}`);
  if( feedData ) {
    feedData.entries.map(e => {
        stringifier.write(e);
    })

    morePages = feedData.itemsPerPage === feedData.entries.length;
    start = start + 50;
    sleep(5000);
  } else {
    consecutiveFailures = consecutiveFailures + 1
    morePages = false
    console.log(`feedData is empty.`);
    if( consecutiveFailures === 1) {
      console.log(`Pausing 30 seconds before continuing`);
      sleep(30000);
    } else {
      console.log(`To resume, execute node index.js --start ${start} --query "${argv.query}"`);
    }
  }
} while (morePages);
stringifier.pipe(writableStream);