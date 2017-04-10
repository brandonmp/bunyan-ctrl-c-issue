I'm using at node 7.1/npm 4.2/ubuntu 16.10. not sure what this requires

Issue only occurs when piping output to the CLI, as in `node index.js | bunyan`

```
git clone https://github.com/brandonmp/bunyan-ctrl-c-issue/blob/master/index.js
cd ./bunyan-ctrl-c-issue
yarn
npm start
```

Should throw this:

```
throw er; // Unhandled 'error' event
      ^

Error: write EPIPE
    at exports._errnoException (util.js:1034:11)
    at WriteWrap.afterWrite [as oncomplete] (net.js:812:14)
```

**When running a server**, this error results in the port remaining in use after the program has ostensibly ended.



## To toggle ignoring EPIPE errors
Set the `SHOULD_IGNORE_EPIPE` const to `true` in `index.js`. This results in a diff't error but doesn't fix problem:
```
Error: This socket is closed
    at Socket._writeGeneric (net.js:691:19)
    at Socket._write (net.js:742:8)
    at doWrite (_stream_writable.js:329:12)
    at writeOrBuffer (_stream_writable.js:315:5)
    at Socket.Writable.write (_stream_writable.js:241:11)
    at Socket.write (net.js:669:40)
    at Logger._emit (/home/bmp/storage/code/bunyan-ctrl-c-issue/node_modules/bunyan/lib/bunyan.js:923:22)
    at Logger.info (/home/bmp/storage/code/bunyan-ctrl-c-issue/node_modules/bunyan/lib/bunyan.js:1045:24)
    at Timeout.setTimeout [as _onTimeout] (/home/bmp/storage/code/bunyan-ctrl-c-issue/index.js:40:13)
    at ontimeout (timers.js:386:14)
```



## To make it work:

```
yarn remove bunyan
yarn add bunyan@1.8.5
npm start
```
