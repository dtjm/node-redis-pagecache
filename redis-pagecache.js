
var PageCache = function(args) {
    this.redis = args.redis;
    this.prefix = args.namespace + ":";
    this.defaultTTL = args.defaultTTL;
};

PageCache.prototype.set = function(url, headers, body, cb) {
    this.redis.hmset(this.prefix+url,
                     "headers", JSON.stringify(headers),
                    "body", body,
                    cb);

    var TTL = this.defaultTTL;
    if(headers["Cache-control"]) {
        var cacheControl = headers["Cache-control"];
        var matches = cacheControl.match(/max-age=([0-9]+)/);
        if(matches[1]) {
            TTL = parseInt(matches[1]);
        }
    }
    this.redis.expire(this.prefix+url, TTL, function(err, reply){
        if(err) console.error("[redis-pagecache]", err);
    });
};

PageCache.prototype.get = function(url, callback) {
    this.redis.hgetall(this.prefix+url, function(err, reply){
        if(err) {
            console.error("Page cache error", err);
            return callback(null, null);
        }

        if(reply && reply.headers && reply.body) {
            var headers = JSON.parse(reply.headers);
            headers["X-TextDrop-Pagecached"] = 1;
            return callback(headers, reply.body);
        }

        callback(null, null);
    });
};

module.exports =  PageCache;
