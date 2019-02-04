const fs = require('fs');
const path = require('path');


const createStream = (file, startandend, response) =>{
  let newStream = fs.createReadStream(file, startandend);
     newStream.on('open', () => {
      newStream.pipe(response);
    });

    newStream.on('error', (streamErr) => {
      response.end(streamErr);
    });
    return newStream;
}

const writeStreamResponseHead = (response, start, end, total, chunksize, type) => {
  response.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': type,
    });
  
  return response;
}


const getFile = (request, response, dir, type) => {
  const file = path.resolve(__dirname, dir);

  fs.stat(file, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        response.writeHead(404);
      }
      return response.end(err);
    }

    let { range } = request.headers;

    if (!range) {
      range = 'bytes=0-';
    }

    const positions = range.replace(/bytes=/, '').split('-');

    let start = parseInt(positions[0], 10);

    const total = stats.size;
    const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

    if (start > end) {
      start = end - 1;
    }

    const chunksize = (end - start) + 1;

    writeStreamResponseHead(response, start, end, total, chunksize, type);

    const stream = createStream(file, { start, end }, response);

     stream.on('error', (streamErr) => {
      response.end(streamErr);
    });
    
    return stream;
  });
};

module.exports.getFile = getFile;
