// Generated by CoffeeScript 1.3.3
var Shader, directives, in_use;

directives = ['precision highp int;', 'precision highp float;'];

in_use = null;

return Shader = (function() {

  Shader.lastError = '';

  Shader.splitLines = function(path, source) {
    var i, line, result, _i, _len, _ref;
    result = [];
    _ref = source.split('\n');
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      line = _ref[i];
      result.push({
        line: i,
        text: line,
        path: path
      });
    }
    return result;
  };

  Shader.error = 'ShaderError';

  function Shader(gl, path, source) {
    var dirname;
    this.gl = gl;
    this.path = path;
    dirname = this.path.split('/');
    dirname.pop();
    this.dirname = dirname.join('/');
    this.program = this.gl.createProgram();
    this.vs = this.gl.createShader(gl.VERTEX_SHADER);
    this.fs = this.gl.createShader(gl.FRAGMENT_SHADER);
    this.gl.attachShader(this.program, this.vs);
    this.gl.attachShader(this.program, this.fs);
    this.link(source);
  }

  Shader.prototype.preprocess = function(source) {
    var global, i, line, lines, match, shaders, type, _i, _len;
    lines = source.split('\n');
    shaders = {
      'global': [],
      'fragment': [],
      'vertex': []
    };
    type = 'global';
    for (i = _i = 0, _len = lines.length; _i < _len; i = ++_i) {
      line = lines[i];
      match = line.match(/^(\w+):$/);
      if (match) {
        type = match[1];
      } else {
        shaders[type].push({
          line: i,
          text: line,
          path: this.path
        });
      }
    }
    global = this.resolveLines(shaders.global);
    shaders.fragment = global.concat(this.resolveLines(shaders.fragment));
    shaders.vertex = global.concat(this.resolveLines(shaders.vertex));
    return shaders;
  };

  Shader.prototype.resolveLines = function(stage) {
    var abspath, lib, line, match, path, result, _i, _j, _len, _len1;
    result = [];
    for (_i = 0, _len = stage.length; _i < _len; _i++) {
      line = stage[_i];
      match = line.text.match(/^\s+#require (\S+)\s*$/);
      if (match) {
        path = "" + match[1] + ".shaderlib";
        abspath = loader.resolvePath(this.dirname, path);
        lib = get(abspath);
        for (_j = 0, _len1 = lib.length; _j < _len1; _j++) {
          line = lib[_j];
          result.push(line);
        }
      } else {
        result.push(line);
      }
    }
    return result;
  };

  Shader.prototype.concat = function(stage) {
    var line, result, _i, _j, _len, _len1;
    result = '';
    for (_i = 0, _len = directives.length; _i < _len; _i++) {
      line = directives[_i];
      result += line + '\n';
    }
    result += '#line 0\n';
    for (_j = 0, _len1 = stage.length; _j < _len1; _j++) {
      line = stage[_j];
      result += line.text + '\n';
    }
    return result;
  };

  Shader.prototype.link = function(source) {
    var error, shaders;
    shaders = this.preprocess(source);
    this.compile(this.vs, shaders.vertex);
    this.compile(this.fs, shaders.fragment);
    this.gl.linkProgram(this.program);
    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      error = "Shader Link Error for file: " + this.path + ":\n" + (this.gl.getProgramInfoLog(this.program));
      console.error(error);
      Shader.lastError = error;
      throw Shader.error;
    }
    this.attrib_cache = {};
    this.uniform_cache = {};
    return this.value_cache = {};
  };

  Shader.prototype.compile = function(shader, lines) {
    var error, group, source, text, translated;
    source = this.concat(lines);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      error = this.gl.getShaderInfoLog(shader);
      group = "Shader Compile Error for file: " + this.path;
      translated = this.translateError(error, lines);
      text = group + '\n' + translated;
      Shader.lastError = text;
      console.group(group);
      console.warn(translated);
      console.groupEnd();
      throw Shader.error;
    }
  };

  Shader.prototype.translateError = function(error, sourcelines) {
    var i, line, lineno, match, message, result, sourceline, _i, _len, _ref;
    result = [];
    _ref = error.split('\n');
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      line = _ref[i];
      match = line.match(/ERROR: \d+:(\d+): (.*)/);
      if (match) {
        lineno = parseFloat(match[1]);
        message = match[2];
        sourceline = sourcelines[lineno - 1];
        result.push("ERROR: Line " + (sourceline.line + 1) + ": File " + sourceline.path + ": " + message + " SOURCE: " + sourceline.text);
      } else {
        result.push(line);
      }
    }
    return result.join('\n');
  };

  Shader.prototype.attribLoc = function(name) {
    var location;
    location = this.attrib_cache[name];
    if (location === void 0) {
      location = this.attrib_cache[name] = this.gl.getAttribLocation(this.program, name);
    }
    if (location >= 0) {
      this.gl.enableVertexAttribArray(location);
    }
    return location;
  };

  Shader.prototype.use = function() {
    if (this !== in_use) {
      in_use = this;
      this.gl.useProgram(this.program);
    }
    return this;
  };

  Shader.prototype.unbind = function() {
    if (in_use) {
      in_use = null;
      this.gl.useProgram(null);
    }
    return this;
  };

  Shader.prototype.loc = function(name) {
    var location;
    location = this.uniform_cache[name];
    if (location === void 0) {
      location = this.uniform_cache[name] = this.gl.getUniformLocation(this.program, name);
    }
    return location;
  };

  Shader.prototype.i = function(name, value) {
    var cached, loc;
    cached = this.value_cache[name];
    if (cached !== value) {
      this.value_cache[name] = value;
      loc = this.loc(name);
      if (loc) {
        this.gl.uniform1i(loc, value);
      }
    }
    return this;
  };

  Shader.prototype.f = function(name, value) {
    var cached, loc;
    cached = this.value_cache[name];
    if (cached !== value) {
      this.value_cache[name] = value;
      loc = this.loc(name);
      if (loc) {
        this.gl.uniform1f(loc, value);
      }
    }
    return this;
  };

  Shader.prototype.fv = function(name, values) {
    var loc;
    loc = this.loc(name);
    if (loc) {
      this.gl.uniform1fv(loc, values);
    }
    return this;
  };

  Shader.prototype.val2 = function(name, a, b) {
    var cached, loc;
    cached = this.value_cache[name];
    if (cached) {
      if (cached.a !== a || cached.b !== b) {
        cached.a = a;
        cached.b = b;
        loc = this.loc(name);
        if (loc) {
          this.gl.uniform2f(loc, a, b);
        }
      }
    } else {
      this.value_cache[name] = {
        a: a,
        b: b
      };
      loc = this.loc(name);
      if (loc) {
        this.gl.uniform2f(loc, a, b);
      }
    }
    return this;
  };

  Shader.prototype.val3 = function(name, a, b, c) {
    var cached, loc;
    cached = this.value_cache[name];
    if (cached) {
      if (cached.a !== a || cached.b !== b || cached.c !== c) {
        cached.a = a;
        cached.b = b;
        cached.c = c;
        loc = this.loc(name);
        if (loc) {
          this.gl.uniform3f(loc, a, b, c);
        }
      }
    } else {
      this.value_cache[name] = {
        a: a,
        b: b,
        c: c
      };
      loc = this.loc(name);
      if (loc) {
        this.gl.uniform3f(loc, a, b, c);
      }
    }
    return this;
  };

  Shader.prototype.vec2 = function(name, value) {
    var loc;
    loc = this.loc(name);
    if (loc) {
      this.gl.uniform2fv(loc, value);
    }
    return this;
  };

  Shader.prototype.vec3 = function(name, value) {
    var loc;
    loc = this.loc(name);
    if (loc) {
      this.gl.uniform3fv(loc, value);
    }
    return this;
  };

  Shader.prototype.val4 = function(name, a, b, c, d) {
    var loc;
    loc = this.loc(name);
    if (loc) {
      this.gl.uniform4f(loc, a, b, c, d);
    }
    return this;
  };

  Shader.prototype.vec4 = function(name, a, b, c, e) {
    var loc;
    loc = this.loc(name);
    if (loc) {
      this.gl.uniform2f(loc, a, b, c, e);
    }
    return this;
  };

  Shader.prototype.mat4 = function(name, value) {
    var loc;
    loc = this.loc(name);
    if (loc) {
      if (value instanceof Mat4) {
        this.gl.uniformMatrix4fv(loc, this.gl.FALSE, value.data);
      } else {
        this.gl.uniformMatrix4fv(loc, this.gl.FALSE, value);
      }
    }
    return this;
  };

  Shader.prototype.mat3 = function(name, value) {
    var loc;
    loc = this.loc(name);
    if (loc) {
      this.gl.uniformMatrix3fv(loc, this.gl.FALSE, value.data);
    }
    return this;
  };

  Shader.prototype.draw = function(drawable) {
    drawable.setPointersForShader(this).draw().disableAttribs(this);
    return this;
  };

  return Shader;

})();
