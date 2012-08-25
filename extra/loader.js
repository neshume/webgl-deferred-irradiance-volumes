// Generated by CoffeeScript 1.3.3
(function() {
  var fs, getBuffer, getJSON, isImage, makeBlob, makeURL, resolvePath;

  fs = {};

  makeURL = function(blob) {
    return URL.createObjectURL(blob);
  };

  makeBlob = function(data, type) {
    var blob, builder;
    builder = new BlobBuilder();
    builder.append(data);
    blob = builder.getBlob(type);
    return blob;
  };

  window.getURL = function(data) {
    var blob;
    blob = makeBlob(data);
    return makeURL(blob);
  };

  resolvePath = function(base, path) {
    if (path[0] === '/') {
      return path;
    } else {
      path = path.split('/');
      if (base === '/') {
        base = [''];
      } else {
        base = base.split('/');
      }
      while (base.length > 0 && path.length > 0 && path[0] === '..') {
        base.pop();
        path.shift();
      }
      if (base.length === 0 || path.length === 0 || base[0] !== '') {
        throw "Invalid path: " + (base.join('/')) + "/" + (path.join('/'));
      }
      return "" + (base.join('/')) + "/" + (path.join('/'));
    }
  };

  getJSON = function(url, callback) {
    var request;
    request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.onload = function() {
      return callback(JSON.parse(request.response));
    };
    return request.send();
  };

  getBuffer = function(url, progress, callback) {
    var request;
    request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.onload = function() {
      return callback(request.response);
    };
    request.onprogress = function(event) {
      if (event.lengthComputable) {
        return progress(event.loaded / event.total);
      }
    };
    return request.send();
  };

  isImage = function(path) {
    return path.match('\.jpg$|\.jpeg|\.gif$|\.png');
  };

  window.loader = {
    resolvePath: resolvePath,
    main: function() {
      var main;
      main = this.require('main');
      if (main.main) {
        return main.main();
      } else {
        throw 'Main function is not defined in main module.';
      }
    },
    define: function(path, code) {
      var dirname, folder, get, require;
      dirname = path.split('/');
      dirname.pop();
      dirname = dirname.join('/');
      require = function(modpath) {
        var abspath, node;
        abspath = resolvePath(dirname, modpath);
        node = fs["" + abspath + ".js"];
        if (!node) {
          node = fs["" + abspath + "/module.js"];
        }
        if (!node) {
          throw "Module not found: " + abspath;
        }
        if (!node.value) {
          node.create();
        }
        return node.value;
      };
      get = function(respath) {
        var abspath, node;
        abspath = resolvePath(dirname, respath);
        node = fs[abspath];
        if (!node) {
          throw "Resource not found: " + abspath;
        }
        return node;
      };
      get.exists = function(respath) {
        var abspath, node;
        abspath = resolvePath(dirname, respath);
        node = fs[abspath];
        return node !== void 0;
      };
      folder = get.folder = function(folderpath) {
        var folder_abs;
        folder_abs = resolvePath(dirname, folderpath);
        return {
          path: folder_abs,
          name: folder_abs.split('/')[folder_abs.split('/').length - 1],
          get: function(respath) {
            var node, nodepath;
            nodepath = resolvePath(folder_abs, respath);
            node = fs[nodepath];
            if (!node) {
              throw "Resource not found: " + nodepath;
            }
            return node;
          },
          exists: function(respath) {
            var nodepath;
            nodepath = resolvePath(folder_abs, respath);
            return fs[nodepath] !== void 0;
          },
          listdir: function(respath) {
            var match, name, nodepath, result, translated, _i, _len;
            if (respath) {
              nodepath = resolvepath(folder_abs, respath);
            } else {
              nodepath = folder_abs;
            }
            result = [];
            for (name in fs) {
              match = name.match("" + folder_abs + "/[a-zA-Z0-9-\.]+");
              if (match) {
                match = match[0];
                if (result.indexOf(match) === -1) {
                  result.push(match);
                }
              }
            }
            translated = [];
            for (_i = 0, _len = result.length; _i < _len; _i++) {
              name = result[_i];
              if (name.match(/\.[a-z]+$/)) {
                translated.push(name);
              } else {
                translated.push(folder(name));
              }
            }
            return translated;
          }
        };
      };
      get.listdir = function(respath, match) {
        var abspath, name, result;
        if (respath) {
          abspath = resolvePath(dirname, respath);
        } else {
          abspath = dirname;
        }
        result = [];
        for (name in fs) {
          if (name.search(abspath) === 0) {
            if (match) {
              if (name.match(match)) {
                result.push(name);
              }
            } else {
              result.push(name);
            }
          }
        }
        return result;
      };
      return fs[path] = {
        path: path,
        type: 'code',
        data: code,
        create: function() {
          var retval;
          this.value = {};
          retval = code(this.value, require, get);
          if (retval) {
            return this.value = retval;
          }
        }
      };
    },
    require: function(modpath) {
      var abspath, node;
      abspath = resolvePath('/', modpath);
      node = fs["" + abspath + ".js"];
      if (!node) {
        node = fs["" + abspath + "/module.js"];
      }
      if (!node) {
        throw "Module not found: " + abspath;
      }
      if (!node.value) {
        node.create();
      }
      return node.value;
    },
    loadPack: function(_arg) {
      var files, hooks, loaded, progress, url;
      url = _arg.url, progress = _arg.progress, loaded = _arg.loaded;
      files = {};
      hooks = this.hooks;
      return getBuffer(url, (function(factor) {
        if (progress) {
          return progress(factor * 0.5, 'network');
        }
      }), function(data) {
        var decoded, decoding, doLoad, i, info, length, metadata, name, result, _i;
        decoding = 0;
        decoded = 0;
        doLoad = function(name, info) {
          var decode, dst, matcher, src, storage;
          if (typeof info === 'object' && info.offset !== void 0 && info.size !== void 0) {
            storage = new ArrayBuffer(info.size);
            dst = new Uint8Array(storage);
            src = new Uint8Array(data, 8 + length + info.offset, info.size);
            dst.set(src);
            dst = dst.buffer;
            if (hooks) {
              for (matcher in hooks) {
                decode = hooks[matcher];
                if (name.match(matcher)) {
                  decoding += 1;
                  decode(dst, function(result) {
                    decoded += 1;
                    files[name] = result;
                    if (progress) {
                      progress(0.5 + (decoded / decoding) * 0.5, 'decode');
                    }
                    if (decoding === decoded && loaded) {
                      return loaded(files);
                    }
                  });
                  return;
                }
              }
            }
            return files[name] = dst;
          } else {
            if (hooks) {
              for (matcher in hooks) {
                decode = hooks[matcher];
                if (name.match(matcher)) {
                  decode(info, function(result) {
                    return files[name] = result;
                  });
                  return;
                }
              }
            }
            return files[name] = info;
          }
        };
        length = new Uint32Array(data, 4, 1)[0];
        metadata = new Uint8Array(data, 8, length);
        result = '';
        for (i = _i = 0; 0 <= length ? _i < length : _i > length; i = 0 <= length ? ++_i : --_i) {
          result += String.fromCharCode(metadata[i]);
        }
        result = JSON.parse(result);
        for (name in result) {
          info = result[name];
          doLoad(name, info, data);
        }
        if (decoding === decoded && loaded) {
          return loaded(files);
        }
      });
    },
    hooks: function(hooks) {
      this.hooks = hooks;
      return this;
    },
    mount: function(_arg) {
      var loaded, mountpoint, progress, url;
      url = _arg.url, mountpoint = _arg.mountpoint, progress = _arg.progress, loaded = _arg.loaded;
      if (mountpoint == null) {
        mountpoint = '/';
      }
      return this.loadPack({
        url: url,
        progress: progress,
        loaded: function(data) {
          var name, value;
          for (name in data) {
            value = data[name];
            fs[name] = value;
          }
          return loaded(data, fs);
        }
      });
    }
  };

}).call(this);