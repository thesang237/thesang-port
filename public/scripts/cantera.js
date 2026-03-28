'use strict';
function _wrapNativeSuper(Class) {
    var _cache = typeof Map === 'function' ? new Map() : undefined;
    _wrapNativeSuper = function _wrapNativeSuper(Class) {
        if (Class === null || !_isNativeFunction(Class)) {
            return Class;
        }
        if (typeof Class !== 'function') {
            throw new TypeError('Super expression must either be null or a function');
        }
        if (typeof _cache !== 'undefined') {
            if (_cache.has(Class)) {
                return _cache.get(Class);
            }
            _cache.set(Class, Wrapper);
        }
        function Wrapper() {
            return _construct(Class, arguments, _getPrototypeOf(this).constructor);
        }
        Wrapper.prototype = Object.create(Class.prototype, {
            constructor: {
                value: Wrapper,
                enumerable: false,
                writable: true,
                configurable: true,
            },
        });
        return _setPrototypeOf(Wrapper, Class);
    };
    return _wrapNativeSuper(Class);
}
function _construct(Parent, args, Class) {
    if (_isNativeReflectConstruct()) {
        _construct = Reflect.construct.bind();
    } else {
        _construct = function _construct(Parent, args, Class) {
            var a = [null];
            a.push.apply(a, args);
            var Constructor = Function.bind.apply(Parent, a);
            var instance = new Constructor();
            if (Class) {
                _setPrototypeOf(instance, Class.prototype);
            }
            return instance;
        };
    }
    return _construct.apply(null, arguments);
}
function _isNativeFunction(fn) {
    return Function.toString.call(fn).indexOf('[native code]') !== -1;
}
function _inherits(subClass, superClass) {
    if (typeof superClass !== 'function' && superClass !== null) {
        throw new TypeError('Super expression must either be null or a function');
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true,
        },
    });
    Object.defineProperty(subClass, 'prototype', { writable: false });
    if (superClass) {
        _setPrototypeOf(subClass, superClass);
    }
}
function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf
        ? Object.setPrototypeOf.bind()
        : function _setPrototypeOf(o, p) {
              o.__proto__ = p;
              return o;
          };
    return _setPrototypeOf(o, p);
}
function _createSuper(Derived) {
    var hasNativeReflectConstruct = _isNativeReflectConstruct();
    return function _createSuperInternal() {
        var Super = _getPrototypeOf(Derived);
        var result;
        if (hasNativeReflectConstruct) {
            var NewTarget = _getPrototypeOf(this).constructor;
            result = Reflect.construct(Super, arguments, NewTarget);
        } else {
            result = Super.apply(this, arguments);
        }
        return _possibleConstructorReturn(this, result);
    };
}
function _possibleConstructorReturn(self, call) {
    if (call && (_typeof(call) === 'object' || typeof call === 'function')) {
        return call;
    } else {
        if (call !== void 0) {
            throw new TypeError('Derived constructors may only return object or undefined');
        }
    }
    return _assertThisInitialized(self);
}
function _assertThisInitialized(self) {
    if (self === void 0) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    return self;
}
function _isNativeReflectConstruct() {
    if (typeof Reflect === 'undefined' || !Reflect.construct) {
        return false;
    }
    if (Reflect.construct.sham) {
        return false;
    }
    if (typeof Proxy === 'function') {
        return true;
    }
    try {
        Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
        return true;
    } catch (e) {
        return false;
    }
}
function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf
        ? Object.getPrototypeOf.bind()
        : function _getPrototypeOf(o) {
              return o.__proto__ || Object.getPrototypeOf(o);
          };
    return _getPrototypeOf(o);
}
function _createForOfIteratorHelper(o, allowArrayLike) {
    var it = (typeof Symbol !== 'undefined' && o[Symbol.iterator]) || o['@@iterator'];
    if (!it) {
        if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || (allowArrayLike && o && typeof o.length === 'number')) {
            if (it) {
                o = it;
            }
            var i = 0;
            var F = function F() {};
            return {
                s: F,
                n: function n() {
                    if (i >= o.length) {
                        return { done: true };
                    }
                    return {
                        done: false,
                        value: o[i++],
                    };
                },
                e: function e(_e25) {
                    throw _e25;
                },
                f: F,
            };
        }
        throw new TypeError('Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.');
    }
    var normalCompletion = true;
    var didErr = false;
    var err;
    return {
        s: function s() {
            it = it.call(o);
        },
        n: function n() {
            var step = it.next();
            normalCompletion = step.done;
            return step;
        },
        e: function e(_e26) {
            didErr = true;
            err = _e26;
        },
        f: function f() {
            try {
                if (!normalCompletion && it.return != null) {
                    it.return();
                }
            } finally {
                if (didErr) {
                    throw err;
                }
            }
        },
    };
}
function _unsupportedIterableToArray(o, minLen) {
    if (!o) {
        return;
    }
    if (typeof o === 'string') {
        return _arrayLikeToArray(o, minLen);
    }
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === 'Object' && o.constructor) {
        n = o.constructor.name;
    }
    if (n === 'Map' || n === 'Set') {
        return Array.from(o);
    }
    if (n === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) {
        return _arrayLikeToArray(o, minLen);
    }
}
function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) {
        len = arr.length;
    }
    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
    return arr2;
}
function _typeof(obj) {
    '@babel/helpers - typeof';
    _typeof =
        'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? function (obj) {
                  return typeof obj;
              }
            : function (obj) {
                  if (obj && 'function' == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype) {
                      return 'symbol';
                  } else {
                      return typeof obj;
                  }
              };
    return _typeof(obj);
}
function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError('Cannot call a class as a function');
    }
}
function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ('value' in descriptor) {
            descriptor.writable = true;
        }
        Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
    }
}
function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) {
        _defineProperties(Constructor.prototype, protoProps);
    }
    if (staticProps) {
        _defineProperties(Constructor, staticProps);
    }
    Object.defineProperty(Constructor, 'prototype', { writable: false });
    return Constructor;
}
function _toPropertyKey(arg) {
    var key = _toPrimitive(arg, 'string');
    if (_typeof(key) === 'symbol') {
        return key;
    } else {
        return String(key);
    }
}
function _toPrimitive(input, hint) {
    if (_typeof(input) !== 'object' || input === null) {
        return input;
    }
    var prim = input[Symbol.toPrimitive];
    if (prim !== undefined) {
        var res = prim.call(input, hint || 'default');
        if (_typeof(res) !== 'object') {
            return res;
        }
        throw new TypeError('@@toPrimitive must return a primitive value.');
    }
    return (hint === 'string' ? String : Number)(input);
}
(function () {
    'use strict';
    var t = {
            824: function _(t) {
                t.exports = {
                    Random: (function () {
                        function Random() {
                            _classCallCheck(this, Random);
                            this.useA = !1;
                            var t = function t(_t) {
                                var n = parseInt(_t.substring(0, 8), 16);
                                var s = parseInt(_t.substring(8, 16), 16);
                                var i = parseInt(_t.substring(16, 24), 16);
                                var e = parseInt(_t.substring(24, 32), 16);
                                return function () {
                                    n |= 0;
                                    s |= 0;
                                    i |= 0;
                                    e |= 0;
                                    var t = (((n + s) | 0) + e) | 0;
                                    e = (e + 1) | 0;
                                    n = s ^ (s >>> 9);
                                    s = (i + (i << 3)) | 0;
                                    i = (i << 21) | (i >>> 11);
                                    i = (i + t) | 0;
                                    return (t >>> 0) / 4294967296;
                                };
                            };
                            this.prngA = new t(tokenData.hash.substring(2, 34));
                            this.prngB = new t(tokenData.hash.substring(34, 66));
                            for (var _t2 = 0; _t2 < 1000000; _t2 += 2) (this.prngA(), this.prngB());
                        }
                        _createClass(Random, [
                            {
                                key: 'random_dec',
                                value: function random_dec() {
                                    this.useA = !this.useA;
                                    return this.useA ? this.prngA() : this.prngB();
                                },
                            },
                        ]);
                        return Random;
                    })(),
                };
            },
            937: function _(t) {
                function n(t) {
                    var n = this;
                    var s =
                        ((i = 4022871197),
                        function (t) {
                            t = String(t);
                            for (var _n = 0; _n < t.length; _n++) {
                                var _s = 0.02519603282416938 * (i += t.charCodeAt(_n));
                                _s -= i = _s >>> 0;
                                _s *= i;
                                _s -= i = _s >>> 0;
                                i += 4294967296 * _s;
                            }
                            return 2.3283064365386963e-10 * (i >>> 0);
                        });
                    var i;
                    n.next = function () {
                        var t = 2091639 * n.s0 + 2.3283064365386963e-10 * n.c;
                        n.s0 = n.s1;
                        n.s1 = n.s2;
                        return (n.s2 = t - (n.c = 0 | t));
                    };
                    n.c = 1;
                    n.s0 = s(' ');
                    n.s1 = s(' ');
                    n.s2 = s(' ');
                    n.s0 -= s(t);
                    if (n.s0 < 0) {
                        n.s0 += 1;
                    }
                    n.s1 -= s(t);
                    if (n.s1 < 0) {
                        n.s1 += 1;
                    }
                    n.s2 -= s(t);
                    if (n.s2 < 0) {
                        n.s2 += 1;
                    }
                    s = null;
                }
                function s(t, n) {
                    n.c = t.c;
                    n.s0 = t.s0;
                    n.s1 = t.s1;
                    n.s2 = t.s2;
                    return n;
                }
                t.exports = {
                    impl: function impl(t, i) {
                        var e = new n(t);
                        var r = i && i.state;
                        var h = e.next;
                        h.int32 = function () {
                            return (4294967296 * e.next()) | 0;
                        };
                        h.double = function () {
                            return h() + 1.1102230246251565e-16 * ((2097152 * h()) | 0);
                        };
                        h.quick = h;
                        if (r) {
                            if ('object' == _typeof(r)) {
                                s(r, e);
                            }
                            h.state = function () {
                                return s(e, {});
                            };
                        }
                        return h;
                    },
                };
            },
            80: function _(t, n, s) {
                var i = s(555);
                t.exports = {
                    BBlock: (function () {
                        function BBlock(t, n, s, e) {
                            _classCallCheck(this, BBlock);
                            this.x0 = t;
                            this.x1 = t + e;
                            this.y0 = n;
                            this.y1 = n + e;
                            this.z0 = s;
                            this.z1 = s + e;
                            this.indRand = new i.myRandom(Math.round(1000 * (1 + i.noise(t, n, s, 77.072))));
                            this.isEmpty = !1;
                            this.isThin = !1;
                            this.isFlat = !1;
                            this.isTip = !1;
                            this.contX = !1;
                            this.contY = !1;
                            this.contZ = !1;
                            this.terrain = MILL ? Math.round(0.5 * i.noise(t, n, 0, 0.02) + 0.5) : 0;
                            this.hasTerrain = !1;
                            this.visited = !1;
                            this.winX = !1;
                            this.winY = !1;
                            this.roof = !1;
                        }
                        _createClass(BBlock, [
                            {
                                key: 'GetNeigh',
                                value: function GetNeigh() {
                                    var t = new Array();
                                    var n = i.GetBlock([this.x0 + 0.1 - S, this.y0 + 0.1, this.z0 + 0.1]);
                                    var s = i.GetBlock([this.x0 + 0.1 + S, this.y0 + 0.1, this.z0 + 0.1]);
                                    var e = i.GetBlock([this.x0 + 0.1, this.y0 + 0.1 - S, this.z0 + 0.1]);
                                    var r = i.GetBlock([this.x0 + 0.1, this.y0 + 0.1 + S, this.z0 + 0.1]);
                                    var h = i.GetBlock([this.x0 + 0.1, this.y0 + 0.1, this.z0 + 0.1 - S]);
                                    var o = i.GetBlock([this.x0 + 0.1, this.y0 + 0.1, this.z0 + 0.1 + S]);
                                    null == n || n.visited || (this.hasTerrain && n.terrain != this.terrain) || t.push(n);
                                    null == s || s.visited || (this.hasTerrain && s.terrain != this.terrain) || t.push(s);
                                    null == e || e.visited || (this.hasTerrain && e.terrain != this.terrain) || t.push(e);
                                    null == r || r.visited || (this.hasTerrain && r.terrain != this.terrain) || t.push(r);
                                    null == h || h.visited || h.isFlat || (h.hasTerrain && h.terrain != this.terrain) || t.push(h);
                                    null == o || o.visited || this.isFlat || (this.hasTerrain && o.terrain != this.terrain) || t.push(o);
                                    for (var _i = 0, _t3 = t; _i < _t3.length; _i++) {
                                        var _n2 = _t3[_i];
                                        _n2.visited = !0;
                                    }
                                    return t;
                                },
                            },
                            {
                                key: 'Resolve',
                                value: function Resolve() {
                                    var t = this.isEmpty;
                                    this.isEmpty = !0;
                                    var n = S;
                                    var s = -1;
                                    var i = 0;
                                    var e = 0;
                                    for (var _t4 = 0; _t4 < S; _t4 += 0.35)
                                        for (var r = 0; r < S; r += 0.35) {
                                            i++;
                                            var h = landscape.Evaluate(this.x0 + _t4, this.y0 + r, this) * U;
                                            var o = h - this.z0;
                                            if (o < n) {
                                                n = o;
                                            }
                                            if (s < o) {
                                                s = o;
                                            }
                                            if (h <= this.z1) {
                                                this.hasTerrain = !0;
                                            }
                                            if (h > this.z0 - 0.02) {
                                                e++;
                                                this.isEmpty = !1;
                                            }
                                        }
                                    if (i > 0) {
                                        e /= i;
                                    }
                                    if (n < 0.5 * S || e < 0.5) {
                                        this.isThin = !0;
                                    }
                                    if (s < S) {
                                        this.isFlat = !0;
                                    }
                                    if ((s < 0.25 * S && n < 0) || e < 0.3) {
                                        this.isTip = !0;
                                    }
                                    if (t && !this.isTip) {
                                        this.isEmpty = !0;
                                    }
                                },
                            },
                            {
                                key: 'Intersect',
                                value: function Intersect(t, n, s, e) {
                                    var r = i.Distance(t, n);
                                    var h = Math.max(1, Math.round(r / D));
                                    var o = t;
                                    var a = 0;
                                    for (var l = 0; l < h + 0.1; l += 1) {
                                        var d = Math.min(l / h, 1);
                                        if (!s && d > 0.01 && d < 0.99) {
                                            d = Math.max(0, Math.min(d + (this.indRand.rnd() - 0.5) * (1 / h), 1));
                                        }
                                        var c = i.lerp(t, n, d);
                                        var u = landscape.Evaluate(c[0], c[1], this) * U - c[2];
                                        if (u >= -0.1) {
                                            if (s) {
                                                return [e + d * r];
                                            }
                                            var _t5 = l > 0 || u < 0.125 * D ? 0 : 3;
                                            var _n3 = o[0] <= this.x0 + 0.05;
                                            var _h = o[1] <= this.y0 + 0.05;
                                            var f = o[2] >= this.z1 - 0.05;
                                            !f || !this.contZ || (_n3 && !this.contX) || (_h && !this.contY) || (_t5 = 0);
                                            !_n3 || !this.contX || (_h && !this.contY) || (f && !this.contZ) || (_t5 = 0);
                                            !_h || !this.contY || (_n3 && !this.contX) || (f && !this.contZ) || (_t5 = 0);
                                            if (_t5 > 0) {
                                                if (f && (!_n3 || (_n3 && this.contX)) && (!_h || (_h && this.contY))) {
                                                    _t5 = 3;
                                                } else {
                                                    if (_n3 && (!_h || (_h && this.contY))) {
                                                        _t5 = 1;
                                                    } else {
                                                        if (_h) {
                                                            _t5 = 2;
                                                        }
                                                    }
                                                }
                                            }
                                            var M = u;
                                            if ((_n3 && !this.winX && (M = -999), _h && !this.winY && (M = -999), l > 0.001)) {
                                                var _t6 = Math.abs(a);
                                                o = i.lerp(o, c, _t6 / Math.max(0.001, _t6 + u));
                                                o[2] = landscape.Evaluate(o[0], o[1], this) * U;
                                            }
                                            return [o[0], o[1], o[2], _t5, e + d * r, 0 == _t5 ? landscape.Color(o[0], o[1], this) : M];
                                        }
                                        o = c;
                                        a = u;
                                    }
                                    return null;
                                },
                            },
                        ]);
                        return BBlock;
                    })(),
                    Continous: function Continous(t, n) {
                        return t.isEmpty == n.isEmpty && ((!t.hasTerrain && !n.hasTerrain) || t.terrain == n.terrain);
                    },
                };
            },
            558: function _(t, n, s) {
                var i = s(555);
                var e = new i.myRandom(0);
                var r = new Array();
                var h = new Array();
                var o = (function () {
                    function o(t, n, s, i, e, r, h, _o, a) {
                        _classCallCheck(this, o);
                        this.S = [t, n, s];
                        this.E = [t + h * i, n + _o * e, s + a * r];
                        this.t = [h, _o, a];
                        this.Si = [Math.round(this.S[0] / i), Math.round(this.S[1] / e), Math.round((this.S[2] + Z) / r)];
                        this.Ei = [Math.round(this.E[0] / i), Math.round(this.E[1] / e), Math.round((this.E[2] + Z) / r)];
                    }
                    _createClass(o, [
                        {
                            key: 'Alter',
                            value: function Alter(t, n, s, i, e) {
                                this.S[0] += t * S + i * S * this.t[0];
                                this.S[1] += n * S + i * S * this.t[1];
                                this.S[2] += s * S + i * S * this.t[2];
                                this.E[0] += t * S + e * S * this.t[0];
                                this.E[1] += n * S + e * S * this.t[1];
                                this.E[2] += s * S + e * S * this.t[2];
                                this.Update();
                            },
                        },
                        {
                            key: 'Update',
                            value: function Update() {
                                a(this.Si, this.S);
                                a(this.Ei, this.E);
                            },
                        },
                        {
                            key: 'RandomCopy',
                            value: function RandomCopy(t, n) {
                                var s = [0, 0, 0];
                                s = this.t[0] > 0.5 ? (t < 0.5 ? [0, 1, 0] : [0, 0, 1]) : this.t[1] > 0.5 ? (t < 0.5 ? [1, 0, 0] : [0, 0, 1]) : t < 0.5 ? [0, 1, 0] : [1, 0, 0];
                                var i = new o(
                                    this.S[0] + s[0] * n * S,
                                    this.S[1] + s[1] * n * S,
                                    this.S[2] + s[2] * n * S,
                                    this.E[0] - this.S[0],
                                    this.E[1] - this.S[1],
                                    this.E[2] - this.S[2],
                                    this.t[0],
                                    this.t[1],
                                    this.t[2],
                                );
                                i.Si = this.Si;
                                i.Ei = this.Ei;
                                return i;
                            },
                        },
                        {
                            key: 'Clear',
                            value: function Clear() {
                                new d(this.S[0], this.E[0], this.S[1], this.E[1], this.S[2], this.E[2]).Clear();
                            },
                        },
                    ]);
                    return o;
                })();
                function a(t, n) {
                    if (3 == t.length && !(t[0] < 0 || t[1] < 0 || t[2] < 0 || t[0] >= h.length || t[1] >= h[t[0]].length || t[2] >= h[t[0]][t[1]].length)) {
                        try {
                            h[t[0]][t[1]][t[2]].Append(n);
                        } catch (_unused) {}
                    }
                }
                var l = (function () {
                    function l() {
                        _classCallCheck(this, l);
                        this.box = null;
                    }
                    _createClass(l, [
                        {
                            key: 'Append',
                            value: function Append(t) {
                                if (null != this.box) {
                                    this.box.Append(t);
                                } else {
                                    this.box = new d(t[0], t[0], t[1], t[1], t[2], t[2]);
                                }
                            },
                        },
                        {
                            key: 'Clear',
                            value: function Clear() {
                                if (null != this.box) {
                                    this.box.Clear();
                                }
                            },
                        },
                    ]);
                    return l;
                })();
                var d = (function () {
                    function d(t, n, s, i, e, r) {
                        _classCallCheck(this, d);
                        this.X = [t, n];
                        this.Y = [s, i];
                        this.Z = [e, r];
                    }
                    _createClass(d, [
                        {
                            key: 'Clear',
                            value: function Clear() {
                                for (var _t7 = this.X[0]; _t7 < this.X[1] + 0.1; _t7 += S)
                                    for (var _n4 = this.Y[0]; _n4 < this.Y[1] + 0.1; _n4 += S)
                                        for (var _s2 = this.Z[0]; _s2 < this.Z[1] + 0.1; _s2 += S) {
                                            var _e = i.GetBlock([_t7 + 0.1, _n4 + 0.1, _s2 + 0.1]);
                                            if (null != _e) {
                                                _e.isEmpty = !0;
                                            }
                                        }
                            },
                        },
                        {
                            key: 'Append',
                            value: function Append(t) {
                                this.X[0] = Math.min(this.X[0], t[0]);
                                this.Y[0] = Math.min(this.Y[0], t[1]);
                                this.Z[0] = Math.min(this.Z[0], t[2]);
                                this.X[1] = Math.max(this.X[1], t[0]);
                                this.Y[1] = Math.max(this.Y[1], t[1]);
                                this.Z[1] = Math.max(this.Z[1], t[2]);
                            },
                        },
                    ]);
                    return d;
                })();
                t.exports = {
                    GrowBoxes: function GrowBoxes(t) {
                        var n = 0;
                        var s = 0;
                        var a = 9999;
                        for (var _t8 = -T / 2; _t8 < T / 2; _t8 += 16)
                            for (var _e2 = -T / 2; _e2 < T / 2; _e2 += 16) {
                                var _r = 0;
                                for (var _n5 = -32; _n5 < 33; _n5 += 16)
                                    for (var _s3 = -32; _s3 < 33; _s3 += 16) for (var _h2 = -16; _h2 < 17; _h2 += 16) _r += Math.abs(i.noise(_t8 + T / 2 + _n5, _e2 + T / 2 + _s3, U / 2 + _h2, 0.012));
                                if (_r < a) {
                                    a = _r;
                                    n = _t8;
                                    s = _e2;
                                }
                            }
                        e = new i.myRandom(Math.round(1000 * R.random_dec()));
                        h = new Array();
                        r = new Array();
                        for (var _a = 0; _a < T; _a += t[0]) {
                            var _d = new Array();
                            for (var _h3 = 0; _h3 < T; _h3 += t[1]) {
                                var c = new Array();
                                for (var _d2 = -Z; _d2 < U; _d2 += t[2])
                                    (c.push(new l()),
                                        Math.abs(i.noise(_a + n, _h3 + s, _d2, 0.012)) > (TERCHANGE && MILL && !FLATTEN ? 0.4 : 0.6) ||
                                            (e.rnd() < 0.72 && r.push(new o(_a, _h3, _d2, t[0], t[1], t[2], 1, 0, 0)),
                                            e.rnd() < 0.72 && r.push(new o(_a, _h3, _d2, t[0], t[1], t[2], 0, 1, 0)),
                                            e.rnd() < 0.82 && r.push(new o(_a, _h3, _d2, t[0], t[1], t[2], 0, 0, 1))));
                                _d.push(c);
                            }
                            h.push(_d);
                        }
                        var d = new Array();
                        for (var _i2 = 0, _r2 = r; _i2 < _r2.length; _i2++) {
                            var _t9 = _r2[_i2];
                            _t9.Alter(Math.round(3 * e.rnd() - 1), Math.round(3 * e.rnd() - 1), Math.round(3 * e.rnd() - 1), Math.round(2 * e.rnd() - 1), Math.round(2 * e.rnd() - 1));
                            var _n6 = e.rnd();
                            var _s4 = Math.round(2 * e.rnd() - 1);
                            if (Math.abs(_s4) > 0.2 && e.rnd() < 0.67) {
                                d.push(_t9.RandomCopy(_n6, _s4));
                            }
                        }
                        for (var _i3 = 0, _d3 = d; _i3 < _d3.length; _i3++) {
                            var _t10 = _d3[_i3];
                            r.push(_t10);
                        }
                    },
                    ClearBoxes: function ClearBoxes() {
                        for (var _i4 = 0, _h4 = h; _i4 < _h4.length; _i4++) {
                            var _t11 = _h4[_i4];
                            var _iterator = _createForOfIteratorHelper(_t11);
                            var _step;
                            try {
                                for (_iterator.s(); !(_step = _iterator.n()).done; ) {
                                    var _n7 = _step.value;
                                    var _iterator2 = _createForOfIteratorHelper(_n7);
                                    var _step2;
                                    try {
                                        for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
                                            var _t12 = _step2.value;
                                            _t12.Clear();
                                        }
                                    } catch (err) {
                                        _iterator2.e(err);
                                    } finally {
                                        _iterator2.f();
                                    }
                                }
                            } catch (err) {
                                _iterator.e(err);
                            } finally {
                                _iterator.f();
                            }
                        }
                        for (var _i5 = 0, _r3 = r; _i5 < _r3.length; _i5++) {
                            var _t13 = _r3[_i5];
                            _t13.Clear();
                        }
                    },
                };
            },
            569: function _(t, n, s) {
                var i = s(555);
                var e = 1.6;
                var r = [
                    [
                        -5, 89, -5, 96, -4, 98, -1, 100, 1, 100, 6, 96, 5, 89, 4, 86, 5, 85, 8, 85, 14, 78, 17, 61, 14, 60, 13, 59, 11, 47, 9, 43, 8, 10, 10, 3, 7, 0, 4, 0, 0, 30, 2, 7, 1, 1, -5, 1,
                        -7, 1, -3, 6, -10, 43, -13, 58, -15, 61, -17, 66, -11, 81, -4, 85, -4, 86,
                    ],
                    [
                        -2, 100, 3, 99, 5, 95, 5, 93, 6, 92, 5, 91, 5, 86, 2, 86, 0, 84, 4, 80, 10, 67, 10, 63, 8, 62, 6, 61, 10, 29, 6, 5, 12, 2, 12, 1, 11, 0, 0, 0, -2, 1, 2, 27, 2, 34, -4, 10, -1,
                        4, -2, 0, -7, 0, -9, 1, -9, 3, -7, 41, -12, 77, -11, 82, -6, 87, -5, 89, -8, 94, -6, 99, -3, 100,
                    ],
                    [1, 100, 5, 97, 5, 88, 12, 84, 15, 62, 7, 25, 7, 13, 5, 10, 4, 1, -5, 1, -6, 3, -6, 40, -9, 44, -11, 46, -12, 48, -15, 79, -10, 84, -8, 88, -6, 90, -6, 98, -2, 100],
                    [
                        1, 101, 6, 98, 6, 93, 5, 89, 5, 88, 14, 77, 14, 44, 11, 43, 6, 6, 7, 2, 7, 0, -2, -1, -2, 1, 0, 3, 1, 4, 1, 35, -1, 40, -3, 1, -4, 0, -14, -1, -14, 1, -11, 2, -10, 4, -11, 58,
                        -11, 63, -12, 64, -13, 67, -6, 84, -3, 86, -4, 87, -6, 88, -6, 97, -4, 100,
                    ],
                    [
                        -6, 98, -8, 86, -13, 80, -13, 64, -12, 63, -9, 10, -11, 2, -11, 1, -4, 0, -5, 9, -1, 41, 4, 6, 3, 3, 3, 0, 12, 0, 12, 2, 8, 8, 10, 48, 13, 50, 12, 56, 8, 63, 13, 64, 13, 73, 8,
                        87, 6, 88, 5, 97, 3, 99, -2, 100,
                    ],
                    [
                        5, 89, 5, 96, 3, 100, -2, 99, -5, 98, -5, 95, -5, 87, -14, 81, -18, 68, -16, 65, -14, 62, -11, 62, -12, 49, -9, 25, -10, 6, -15, 1, -14, 0, -4, 1, -5, 4, -4, 6, -4, 8, 0, 44,
                        1, 44, 3, 2, 4, 1, 10, 1, 11, 6, 10, 8, 11, 63, 13, 63, 18, 66, 15, 81, 5, 88,
                    ],
                    [
                        -3, 98, -1, 100, 5, 100, 6, 97, 6, 88, 7, 86, 7, 85, 10, 82, 11, 47, 9, 43, 10, 6, 11, 3, 11, 1, -10, 1, -11, 3, -4, 7, -9, 62, -11, 67, -6, 79, -2, 82, -1, 84, -1, 85, -2, 87,
                        -4, 87, -4, 95,
                    ],
                ];
                var h = new i.myRandom(1);
                var o = new Array();
                var a = new Array();
                var l = new Array();
                function d(t, n, s, i, r) {
                    if (t.isEmpty && t.roof) {
                        for (var _o2 = 0; _o2 < n; _o2++)
                            for (var _a2 = 0; _a2 < n; _a2++)
                                for (var _d4 = 0; _d4 < 10; _d4++) {
                                    var _d5 = t.x0 + ((0.2 + 0.6 * h.rnd()) * (t.x1 - t.x0)) / n + (_o2 * (t.x1 - t.x0)) / n;
                                    var _c = t.y0 + ((0.2 + 0.6 * h.rnd()) * (t.y1 - t.y0)) / n + (_a2 * (t.y1 - t.y0)) / n;
                                    var _f = t.z0 + 0.1;
                                    var M = t.z0 + 1.92 + 0.1;
                                    var p = (CAM.planeX[0] * e) / 4;
                                    var g = (CAM.planeX[1] * e) / 4;
                                    var m = new u(_d5, _c, _f, 0.02 * (0.5 + 0.5 * h.rnd()));
                                    var C = new u(_d5 - p, _c - g, _f, 0);
                                    var _S = new u(_d5 + p, _c + g, _f, 0);
                                    var _R = new u(_d5 - p, _c - g, M, 0);
                                    var x = new u(_d5 + p, _c + g, M, 0);
                                    if (
                                        (m.BrighAndOp(s, i, r),
                                        C.BrighAndOp(s, i, r),
                                        _S.BrighAndOp(s, i, r),
                                        _R.BrighAndOp(s, i, r),
                                        x.BrighAndOp(s, i, r),
                                        m.UpdateColor((C.bright + _S.bright + x.bright + _R.bright) / 4),
                                        m.isVis && C.isVis && _S.isVis && x.isVis && _R.isVis)
                                    ) {
                                        if (m.rand.rnd() > 0.1 + 0.4 * m.bright) {
                                            l.push(m);
                                        }
                                        break;
                                    }
                                }
                    }
                }
                var c = (function () {
                    function c(t, n, s) {
                        _classCallCheck(this, c);
                        this.brease = !0;
                        this.firstpass = !0;
                        this.pos = [t, n, s];
                        this.rPos = [t, n, s];
                        this.scPos = [0, 0, 0];
                        this.rand = new i.myRandom(Math.round(1000 * h.rnd()));
                        this.speed = 0.25 + 1.5 * this.rand.rnd();
                        this.bright = 0;
                        this.oldb = 0;
                        this.opacity = 0;
                        var e = this.rand.rnd();
                        this.clr = [255, 255, 255];
                        if (e < 0.4) {
                            this.clr = CUTCLR;
                        } else {
                            if (e < 0.6) {
                                this.clr = [1.75 * TERCLR[0], 1.75 * TERCLR[1], 1.75 * TERCLR[2]];
                            }
                        }
                        this.isVis = !1;
                        this.die = 0;
                        this.alone = 0;
                    }
                    _createClass(c, [
                        {
                            key: 'BrighAndOp',
                            value: function BrighAndOp(t, n, e) {
                                this.scPos = CAM.ScreenP(this.rPos, t, n, e);
                                var r = 1 - 0.33 * Math.max(0, Math.min(1, (this.scPos[2] - 400) / 350));
                                if (((this.isVis = !i.IsFrame(this.scPos[0], this.scPos[1], n, e, t, 0.5) && i.IsVis(this.scPos, n, e)), (this.rand.rnd() < 0.05 && this.brease) || this.firstpass)) {
                                    s.g.D = S / 2;
                                    var _t14 = this.brease ? 1 : 0;
                                    var _n8 = i.Trace(this.rPos, i.RotateXZ(LV[0], LV[1], LV[2], 0.2 * _t14 * (this.rand.rnd() - 0.5), 0.15 * _t14 * (this.rand.rnd() - 0.5)), 0.2 * T, !0, !0);
                                    var _e3 = null == _n8 ? 1 : Math.min(1, _n8[0] / (0.2 * T));
                                    this.oldb = _e3 * (this.brease ? 1.2 + 0.6 * this.rand.rnd() : 1);
                                }
                                var h = this.isVis && this.die < 0.5 && this.alone < 30 ? 1 : 0;
                                this.opacity = this.opacity + (h - this.opacity) * (this.firstpass ? 1 : 0.75);
                                this.bright = this.bright + (this.oldb * (0.5 + 0.5 * h) - this.bright) * (this.firstpass ? 1 : 0.25);
                                this.firstpass = !1;
                                return r;
                            },
                        },
                    ]);
                    return c;
                })();
                var u = (function (_c2) {
                    _inherits(u, _c2);
                    var _super = _createSuper(u);
                    function u(t, n, s, i) {
                        var _this;
                        _classCallCheck(this, u);
                        _this = _super.call(this, t, n, s);
                        _this.delta = i;
                        _this.ind = Math.max(0, Math.min(r.length - 1, Math.floor(0.999 * _this.rand.rnd() * r.length)));
                        _this.flip = _this.rand.rnd() > 0.5 ? 1.25 : -1.25;
                        _this.brease = !1;
                        _this.age = 20 * _this.rand.rnd();
                        return _this;
                    }
                    _createClass(u, [
                        {
                            key: 'UpdateColor',
                            value: function UpdateColor(t) {
                                this.bright = t;
                                if (this.rand.rnd() < 0.6 * this.bright + 0.2) {
                                    this.clr = [TERCLR[0] / 1.6, TERCLR[1] / 1.6, TERCLR[2] / 1.6];
                                }
                            },
                        },
                        {
                            key: 'Render',
                            value: function Render(t, n, s) {
                                this.age -= this.delta;
                                if (this.age <= 0) {
                                    this.age = 20;
                                }
                                var h = this.BrighAndOp(t, n, s);
                                var o = 0.8 * Math.min(this.age, 10 - this.age, 0.5) * 2;
                                if (o > 0.01) {
                                    var _n9 = h / t;
                                    var _s5 = 0.016 * _n9;
                                    birdCtx.beginPath();
                                    birdCtx.moveTo(this.scPos[0] + this.flip * _s5 * r[this.ind][0], this.scPos[1] - _s5 * r[this.ind][1]);
                                    for (var _t15 = 2; _t15 < r[this.ind].length - 1; _t15 += 2)
                                        birdCtx.lineTo(this.scPos[0] + this.flip * _s5 * r[this.ind][_t15], this.scPos[1] - _s5 * r[this.ind][_t15 + 1]);
                                    birdCtx.closePath();
                                    var _a3 = birdCtx.createLinearGradient(this.scPos[0], this.scPos[1] - _n9 * e, this.scPos[0], this.scPos[1]);
                                    _a3.addColorStop(0, i.hashColor([this.clr[0], this.clr[1], this.clr[2], 0.95 * o]));
                                    _a3.addColorStop(1, i.hashColor([this.clr[0], this.clr[1], this.clr[2], 0.05 * o]));
                                    var _l = birdCtx.createLinearGradient(this.scPos[0], this.scPos[1] - _n9 * e, this.scPos[0], this.scPos[1]);
                                    _l.addColorStop(0, i.hashColor([0, 0, 0, 0.95 * o]));
                                    _l.addColorStop(0.5, i.hashColor([0, 0, 0, 0.9 * o]));
                                    _l.addColorStop(1, i.hashColor([0, 0, 0, 0.05 * o]));
                                    birdCtx.lineWidth = 0.04 / t;
                                    birdCtx.strokeStyle = _l;
                                    for (var _t16 = 0; _t16 < 2; _t16++) birdCtx.stroke();
                                    birdCtx.fillStyle = _a3;
                                    birdCtx.fill();
                                }
                            },
                        },
                    ]);
                    return u;
                })(c);
                var f = (function (_c3) {
                    _inherits(f, _c3);
                    var _super2 = _createSuper(f);
                    function f(t, n, s) {
                        var _this2;
                        _classCallCheck(this, f);
                        _this2 = _super2.call(this, t, n, s);
                        _this2.neigh = new Array();
                        _this2.RDir();
                        _this2.towards = [0, 1, 0];
                        _this2.right = [1, 0, 0];
                        return _this2;
                    }
                    _createClass(f, [
                        {
                            key: 'RDir',
                            value: function RDir() {
                                this.forward = [0, 1, 0];
                                var t = 2 * Math.PI * this.rand.rnd() - Math.PI;
                                var n = 2 * Math.PI * this.rand.rnd() - Math.PI;
                                this.forward = i.RotateXZ(0, 1, 0, t, n);
                            },
                        },
                        {
                            key: 'Render',
                            value: function Render(t, n, s) {
                                var e = !1;
                                for (var _t17 = 0; _t17 < 25; _t17++) {
                                    e = !0;
                                    var _t18 = [this.pos[0], this.pos[1], this.pos[2]];
                                    if (
                                        ((this.pos = i.addVec(this.pos, this.forward, 0.08 * this.speed * 4)),
                                        ((this.pos[2] > U / 1.4 && this.forward[2] > 0) ||
                                            (this.pos[0] > T && this.forward[0] > 0) ||
                                            (this.pos[0] < 0 && this.forward[0] < 0) ||
                                            (this.pos[1] < 0 && this.forward[1] < 0) ||
                                            (this.pos[1] > T && this.forward[1] > 0) ||
                                            (this.pos[2] < 0 && this.forward[2] < 0) ||
                                            null != i.GetBlock(this.pos)) &&
                                            ((e = !1), (this.pos = _t18), this.RDir()),
                                        e)
                                    ) {
                                        this.die = 0;
                                        break;
                                    }
                                }
                                e || this.die++;
                                var r = [0.08 * (this.pos[0] - this.rPos[0]), 0.08 * (this.pos[1] - this.rPos[1]), 0.08 * (this.pos[2] - this.rPos[2])];
                                this.towards = i.lerp(this.towards, r, 0.8);
                                this.rPos = i.addVec(this.rPos, this.towards, 1);
                                var h = this.BrighAndOp(t, n, s);
                                if (this.opacity > 0.1) {
                                    var _e4 = this.bright * (1 + 0.45 * this.rand.rnd());
                                    var _r4 = i.hashColor([this.clr[0] * _e4, this.clr[1] * _e4, this.clr[2] * _e4, this.opacity]);
                                    var _o3 = i.normalize(this.towards);
                                    var _a4 = [0, 0, 1];
                                    var _l2 = [1, 0, 0];
                                    if (Math.abs(_o3[2]) > 0.999) {
                                        _o3 = [0, 0, _o3[2] > 0.5 ? 1 : -1];
                                        _l2 = [this.right[0], this.right[1], 0];
                                        _l2 = Math.sqrt(_l2[0] * _l2[0] + _l2[1] * _l2[1]) < 0.1 ? i.RotateXZ(1, 0, 0, 0, 2 * Math.PI * this.rand.rnd()) : i.normalize(_l2);
                                    } else {
                                        _l2 = i.CrossProduct(_o3, _a4);
                                    }
                                    this.right = _l2;
                                    _a4 = i.CrossProduct(_l2, _o3);
                                    var _d6 = 0.65 * Math.PI * this.rand.rnd() - 0.35;
                                    var _c4 = CAM.ScreenP(i.addVec(this.rPos, _o3, 0.36 * h), t, n, s);
                                    for (var _e5 = -1; _e5 < 1.2; _e5 += 2) {
                                        var _o4 = i.RotateZ(_e5, 0, 0, _e5 * _d6);
                                        var _u = CAM.ScreenP(i.addVec(this.rPos, i.normalize(i.addVec(i.addVec([0, 0, 0], _l2, _o4[0]), _a4, _o4[1])), 0.35 * h), t, n, s);
                                        birdCtx.fillStyle = _r4;
                                        birdCtx.beginPath();
                                        birdCtx.moveTo(this.scPos[0], this.scPos[1]);
                                        birdCtx.lineTo(_u[0], _u[1]);
                                        birdCtx.lineTo(_c4[0], _c4[1]);
                                        birdCtx.strokeStyle = _r4;
                                        birdCtx.lineWidth = 0.07 / t;
                                        birdCtx.stroke();
                                        birdCtx.fill();
                                    }
                                }
                            },
                        },
                    ]);
                    return f;
                })(c);
                t.exports = {
                    SetUpEffects: function SetUpEffects() {
                        h = new i.myRandom(Math.round(1000 * R.random_dec()));
                        o = new Array();
                        a = new Array();
                        for (var _t19 = 0; _t19 < 45; _t19++) {
                            var _t20 = new Array();
                            var _n10 = 1;
                            var _s6 = 4;
                            if (h.rnd() < 0.08) {
                                _n10 = 8;
                                _s6 = 14;
                            }
                            var _e6 = _n10 + Math.round(_s6 * h.rnd());
                            for (var _n11 = 0; _n11 < 150; _n11++) {
                                var _n12 = Math.floor((h.rnd() * T) / S) * S + S / 2;
                                var _s7 = Math.floor((h.rnd() * T) / S) * S + S / 2;
                                var _r5 = Math.floor((h.rnd() * U * 0.5) / S) * S + S / 2;
                                if (null == i.GetBlock([_n12, _s7, _r5])) {
                                    for (var _i6 = 0; _i6 < _e6; _i6++) _t20.push(new f(_n12 + 2 * h.rnd() - 1, _s7 + 2 * h.rnd() - 1, _r5 + 2 * h.rnd() - 1));
                                    break;
                                }
                            }
                            if (0 != _t20.length) {
                                o.push(_t20);
                                a.push(0.1 + 0.5 * h.rnd());
                            }
                        }
                    },
                    SetUpPeople: function SetUpPeople(t, n, s) {
                        l = new Array();
                        var _iterator3 = _createForOfIteratorHelper(BLOCKS);
                        var _step3;
                        try {
                            for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
                                var _i7 = _step3.value;
                                var _iterator4 = _createForOfIteratorHelper(_i7);
                                var _step4;
                                try {
                                    for (_iterator4.s(); !(_step4 = _iterator4.n()).done; ) {
                                        var _e7 = _step4.value;
                                        var _iterator5 = _createForOfIteratorHelper(_e7);
                                        var _step5;
                                        try {
                                            for (_iterator5.s(); !(_step5 = _iterator5.n()).done; ) {
                                                var _i8 = _step5.value;
                                                try {
                                                    d(_i8, 2, t, n, s);
                                                } catch (_unused2) {}
                                            }
                                        } catch (err) {
                                            _iterator5.e(err);
                                        } finally {
                                            _iterator5.f();
                                        }
                                    }
                                } catch (err) {
                                    _iterator4.e(err);
                                } finally {
                                    _iterator4.f();
                                }
                            }
                        } catch (err) {
                            _iterator3.e(err);
                        } finally {
                            _iterator3.f();
                        }
                        l.length < 1 ||
                            l.sort(function (t, n) {
                                return t.rPos[2] - n.rPos[2];
                            });
                    },
                    RenderBirds: function RenderBirds(t, n, s) {
                        birdCtx.imageSmoothingEnabled = !1;
                        birdCtx.lineJoin = 'round';
                        for (var _i9 = 0, _l3 = l; _i9 < _l3.length; _i9++) {
                            var _i10 = _l3[_i9];
                            _i10.Render(t, n, s);
                        }
                        for (var _e8 = 0; _e8 < o.length; _e8++) {
                            var _r6 = o[_e8];
                            for (var _t21 = 0; _t21 < _r6.length; _t21++) (_r6[_t21].neigh.splice(0, _r6[_t21].neigh.length), 0 == _t21 && _r6[_t21].rand.rnd() < 0.005 && _r6[_t21].RDir());
                            for (var _t22 = 0; _t22 < _r6.length; _t22++)
                                try {
                                    var _n13 = _r6[_t22];
                                    var _s8 = _n13.pos[0];
                                    var _i11 = _n13.pos[1];
                                    var _h5 = _n13.pos[2];
                                    if (_n13.die > 5 || _n13.alone > 50) {
                                        var _iterator6 = _createForOfIteratorHelper(_r6);
                                        var _step6;
                                        try {
                                            for (_iterator6.s(); !(_step6 = _iterator6.n()).done; ) {
                                                var _t23 = _step6.value;
                                                if (!(_t23.die > 0 || _t23.alone > 10)) {
                                                    _n13.die = 0;
                                                    _n13.alone = 0;
                                                    _n13.pos = [_t23.pos[0] + _n13.rand.rnd() + 0.01, _t23.pos[1] + _n13.rand.rnd() + 0.01, _t23.pos[2] + _n13.rand.rnd() + 0.01];
                                                    break;
                                                }
                                            }
                                        } catch (err) {
                                            _iterator6.e(err);
                                        } finally {
                                            _iterator6.f();
                                        }
                                    }
                                    if (_t22 >= _r6.length - 1) {
                                        continue;
                                    }
                                    for (var _o5 = _t22 + 1; _o5 < _r6.length; _o5++) {
                                        if (_n13.rand.rnd() < a[_e8]) {
                                            continue;
                                        }
                                        var _l4 = _r6[_o5];
                                        var _d7 = _l4.pos[0];
                                        var _c5 = _l4.pos[1];
                                        var _u2 = _l4.pos[2];
                                        var _f2 = Math.abs(_s8 - _d7);
                                        if (_t22 > 0 && _f2 > 4) {
                                            continue;
                                        }
                                        var M = Math.abs(_i11 - _c5);
                                        if (_t22 > 0 && M > 4) {
                                            continue;
                                        }
                                        var p = Math.abs(_h5 - _u2);
                                        if (_t22 > 0 && p > 4) {
                                            continue;
                                        }
                                        var g = Math.sqrt(_f2 * _f2 + M * M + p * p);
                                        (_t22 > 0 && g > 4) || (_l4.neigh.push([_t22, g]), 0 == _t22 && (g > 60 ? (_l4.alone++, _l4.alone > 99999 && (_l4.alone = 99999)) : (_l4.alone = 0)));
                                    }
                                } catch (_unused3) {}
                            var _iterator7 = _createForOfIteratorHelper(_r6);
                            var _step7;
                            try {
                                for (_iterator7.s(); !(_step7 = _iterator7.n()).done; ) {
                                    var _e9 = _step7.value;
                                    try {
                                        var _h6 = [0, 0, 0];
                                        var _o6 = [0, 0, 0];
                                        var _a5 = !0;
                                        var _iterator8 = _createForOfIteratorHelper(_e9.neigh);
                                        var _step8;
                                        try {
                                            for (_iterator8.s(); !(_step8 = _iterator8.n()).done; ) {
                                                var _t24 = _step8.value;
                                                if (_e9.rand.rnd() < 0.25) {
                                                    _e9.forward = i.lerp(_e9.forward, _r6[_t24[0]].forward, 0.08);
                                                }
                                                var _n14 = [_r6[_t24[0]].pos[0] - _e9.pos[0], _r6[_t24[0]].pos[1] - _e9.pos[1], _r6[_t24[0]].pos[2] - _e9.pos[2]];
                                                if (_a5 || _e9.rand.rnd() < 0.25) {
                                                    _h6 = i.addVec(_h6, _n14, 0.33);
                                                }
                                                _a5 = !1;
                                                var _s9 = 3.5 - _t24[1];
                                                if (_s9 > 0) {
                                                    _o6 = i.addVec(_o6, i.normalize(_n14), -_s9);
                                                }
                                            }
                                        } catch (err) {
                                            _iterator8.e(err);
                                        } finally {
                                            _iterator8.f();
                                        }
                                        _e9.forward = i.clamp(_e9.forward, 3.3);
                                        _e9.forward = i.addVec(i.addVec(_e9.forward, _h6, 0.02), _o6, 0.04);
                                        _e9.Render(t, n, s);
                                    } catch (_unused4) {}
                                }
                            } catch (err) {
                                _iterator7.e(err);
                            } finally {
                                _iterator7.f();
                            }
                        }
                    },
                };
            },
            374: function _(t, n, s) {
                var i = s(555);
                var e = (function (_Array) {
                    _inherits(e, _Array);
                    var _super3 = _createSuper(e);
                    function e(t, n, s) {
                        var _this3;
                        _classCallCheck(this, e);
                        _this3 = _super3.call(this);
                        _this3.orgRnd = s;
                        _this3.conRand = new i.myRandom(Math.round(1000 * s));
                        _this3.indRand = new i.myRandom(Math.round(1000 * R.random_dec()));
                        for (var _s10 = 0; _s10 < t; _s10++) {
                            var _t25 = new Array();
                            for (var _s11 = 0; _s11 < n; _s11++) _t25.push(0);
                            _this3.push(_t25);
                        }
                        return _this3;
                    }
                    _createClass(e, [
                        {
                            key: 'WriteN',
                            value: function WriteN(t, n, s) {
                                var i = Math.max(0, Math.min(this.length - 1, Math.round(n * this.length)));
                                var _e10 = Math.max(0, Math.min(this[i].length - 1, Math.round(s * this[i].length)));
                                this[i][_e10] = t;
                            },
                        },
                        {
                            key: 'ReadN',
                            value: function ReadN(t, n) {
                                var s = Math.max(0, Math.min(this.length - 1, t * this.length));
                                var i = Math.max(0, Math.min(this[0].length - 1, n * this[0].length));
                                return this.Eval(s, i, !0)[2];
                            },
                        },
                        {
                            key: 'Grow',
                            value: function Grow(t, n, s, i, _e11) {
                                this.NoiseGrowth(
                                    12 * (0.155 + 0.65 * this.conRand.rnd()),
                                    100 * this.conRand.rnd(),
                                    0.025,
                                    -0.5 * this.conRand.rnd() - 0.5,
                                    0.5 + 0.5 * this.conRand.rnd(),
                                    !1,
                                    1,
                                    1,
                                    _e11,
                                );
                                this.NoiseGrowth(
                                    12 * (0.45 + 0.65 * this.conRand.rnd()),
                                    100 * this.conRand.rnd(),
                                    0.025,
                                    -0.5 * this.conRand.rnd() - 0.5,
                                    1,
                                    !0,
                                    10 * this.conRand.rnd(),
                                    0.03 + 0.06 * this.conRand.rnd(),
                                    _e11,
                                );
                                this.NoiseGrowth(8, 100 * this.conRand.rnd(), 0.006, -0.5 * this.conRand.rnd() - 0.5, 0.5 + 0.5 * this.conRand.rnd(), !1, 1, 1, _e11);
                                this.Erode(15000, 0.05, 30, 0.2, 0.06, !0, 2 * t, n, 2 * s, i);
                                this.Resize(T, T);
                                this.NoiseGrowth(24, 100 * this.conRand.rnd(), 0.004, -0.25 * this.conRand.rnd() - 0.75, 1, !1, 100 * this.conRand.rnd(), 0.012, _e11);
                                var r = 100 * this.conRand.rnd();
                                this.NoiseGrowth(16.08, 100 * this.conRand.rnd(), 0.012, -0.3 * this.conRand.rnd() - 0.3, 1, !0, r, 0.012, _e11);
                                this.NoiseGrowth(7.92, 100 * this.conRand.rnd(), 0.022, -0.3 * this.conRand.rnd() - 0.3, 1, !0, r, 0.012, _e11);
                                this.NoiseGrowth(6, 100 * this.conRand.rnd(), 0.015, -1, 1, !0, 10 * this.conRand.rnd(), 0.012, _e11);
                                this.Erode(70000, 0.05, 40, 0.2, 0.05, !0, t, n, s, i);
                                this.Normalize();
                                this.Resize(2 * T, 2 * T);
                                this.Erode(100000, 0.05, 40, 0.2, 0.05, !0, t / 2, n, s / 2, i);
                            },
                        },
                        {
                            key: 'NoiseGrowth',
                            value: function NoiseGrowth(t, n, s, _e12, r, h, o, a, l) {
                                var d = this.RandomTransformation();
                                for (var c = 0; c < this.length; c++)
                                    for (var u = 0; u < this[c].length; u++) {
                                        var f = i.Rotate(c * d[1], u * d[2], d[0]);
                                        var M =
                                            ((Math.min(r, Math.max(_e12, (l ? -1 : 1) * i.noise(f[0], f[1], n, s))) - _e12) / Math.max(0.1, r - _e12)) *
                                            (h ? 0.75 + 0.75 * Math.min(0.5, Math.max(-0.5, (l ? -1 : 1) * i.noise(c, u, o, a))) : 1);
                                        this[c][u] = Math.round(1000 * (this[c][u] + Math.round((1000 * t * M) / 30) / 1000)) / 1000;
                                    }
                            },
                        },
                        {
                            key: 'Curvature',
                            value: function Curvature(t, n, s) {
                                return 10 * (this.Eval(t, n, !0)[2] - this.MidH(t, n, s));
                            },
                        },
                        {
                            key: 'MidH',
                            value: function MidH(t, n, s) {
                                return (this.Eval(t - s, n - s, !0)[2] + this.Eval(t - s, n + s, !0)[2] + this.Eval(t + s, n + s, !0)[2] + this.Eval(t + s, n - s, !0)[2]) / 4;
                            },
                        },
                        {
                            key: 'Eval',
                            value: function Eval(t, n, s) {
                                var i = Math.max(0, Math.min(this.length - 2, t));
                                var _e13 = Math.max(0, Math.min(this[0].length - 2, n));
                                var r = Math.max(0, Math.min(this.length - 2, Math.floor(i)));
                                var h = Math.max(0, Math.min(this[0].length - 2, Math.floor(_e13)));
                                var o = i - r;
                                var a = _e13 - h;
                                var l = this[r][h];
                                var d = this[r + 1][h];
                                var c = this[r][h + 1];
                                var u = this[r + 1][h + 1];
                                var f = l * (1 - o) * (1 - a) + d * o * (1 - a) + c * (1 - o) * a + u * o * a;
                                if (s) {
                                    return [0, 0, Math.round(1000 * f) / 1000];
                                }
                                var M = (d - l) * (1 - a) + (u - c) * a;
                                var p = (c - l) * (1 - o) + (u - d) * o;
                                return [Math.round(-1000 * M) / 1000, Math.round(-1000 * p) / 1000, Math.round(1000 * f) / 1000];
                            },
                        },
                        {
                            key: 'Resize',
                            value: function Resize(t, n) {
                                if (t < 1) {
                                    t = 1;
                                }
                                if (n < 1) {
                                    n = 1;
                                }
                                var s = new e(0, 0, this.conRand.rnd());
                                if (this.length < 2) {
                                    return s;
                                }
                                if (this[0].length < 2) {
                                    return s;
                                }
                                var i = (this.length - 1) / t;
                                var r = (this[0].length - 1) / n;
                                for (var _e16 = 0; _e16 < t + 1; _e16++) {
                                    var _t26 = new Array();
                                    for (var _s12 = 0; _s12 < n + 1; _s12++) _t26.push(this.Eval(_e16 * i, _s12 * r, !0)[2]);
                                    s.push(_t26);
                                }
                                this.splice(0, this.length);
                                for (var _t27 = 0; _t27 < s.length; _t27++) this.push(s[_t27]);
                            },
                        },
                        {
                            key: 'Normalize',
                            value: function Normalize() {
                                var t = 99999;
                                var n = -99999;
                                for (var _s13 = 0; _s13 < this.length; _s13++)
                                    for (var _i12 = 0; _i12 < this[_s13].length; _i12++) (t > this[_s13][_i12] && (t = this[_s13][_i12]), n < this[_s13][_i12] && (n = this[_s13][_i12]));
                                if (Math.abs(n - t) > 1) {
                                    for (var _s14 = 0; _s14 < this.length; _s14++)
                                        for (var _i13 = 0; _i13 < this[_s14].length; _i13++) this[_s14][_i13] = Math.round((1000 * (this[_s14][_i13] - t)) / Math.max(0.1, n - t)) / 1000;
                                } else {
                                    for (var _n15 = 0; _n15 < this.length; _n15++)
                                        for (var _s15 = 0; _s15 < this[_n15].length; _s15++) this[_n15][_s15] = Math.round(1000 * (this[_n15][_s15] - t)) / 1000;
                                }
                            },
                        },
                        {
                            key: 'Erode',
                            value: function Erode(t, n, s, i, _e15, h, o, a, l, d) {
                                if (this.length - 1 < 1) {
                                    return;
                                }
                                if (this[0].length - 1 < 1) {
                                    return;
                                }
                                var c = this.length - 1;
                                var u = this[0].length - 1;
                                for (var f = 0; f < t; f++) {
                                    var _t28 = Math.round(1000 * this.indRand.rnd() * c) / 1000;
                                    var _f3 = Math.round(1000 * this.indRand.rnd() * u) / 1000;
                                    var M = 1;
                                    var p = 0;
                                    var g = Math.max(1, 0.5 * this.indRand.rnd() * s);
                                    var m = 0;
                                    var C = 0;
                                    var _S2 = 1 / g;
                                    for (var _s16 = 0; _s16 < g; _s16++) {
                                        var _s17 = Math.floor(_t28);
                                        var _c6 = Math.floor(_f3);
                                        if (_s17 <= 0 || _c6 <= 0 || _s17 >= this.length - 1 || _c6 >= this[0].length - 1) {
                                            break;
                                        }
                                        var _u3 = _t28 - _s17;
                                        var _g = _f3 - _c6;
                                        var _R2 = this.Eval(_t28, _f3, !1);
                                        m = n * m + (1 - n) * _R2[0];
                                        C = n * C + (1 - n) * _R2[1];
                                        var x = Math.sqrt(m * m + C * C);
                                        if (
                                            (x > 0.001 ? ((m /= x), (C /= x)) : ((m = 0), (C = 0)),
                                            (_t28 += m),
                                            (_f3 += C),
                                            _t28 < 0.5 || _f3 < 0.5 || _t28 > this.length - 1.5 || _f3 > this[0].length - 1.5 || (0 == m && 0 == C))
                                        ) {
                                            break;
                                        }
                                        var y = this.Eval(_t28, _f3, !0)[2] - _R2[2];
                                        var w = Math.max(0.01, -y * M * 40);
                                        if (p > w || y > 0) {
                                            var _n16 = y > 0 ? Math.min(y, p) : (p - w) * i * r(_t28, _f3, h, l, d);
                                            p -= _n16;
                                            this[_s17][_c6] = Math.round(10000 * (this[_s17][_c6] + _n16 * (1 - _u3) * (1 - _g))) / 10000;
                                            this[_s17 + 1][_c6] = Math.round(10000 * (this[_s17 + 1][_c6] + _n16 * _u3 * (1 - _g))) / 10000;
                                            this[_s17][_c6 + 1] = Math.round(10000 * (this[_s17][_c6 + 1] + _n16 * (1 - _u3) * _g)) / 10000;
                                            this[_s17 + 1][_c6 + 1] = Math.round(10000 * (this[_s17 + 1][_c6 + 1] + _n16 * _u3 * _g)) / 10000;
                                        } else {
                                            var _n17 = Math.min(-y, (w - p) * _e15 * r(_t28, _f3, h, o, a));
                                            var _i14 = Math.min(_n17 * (1 - _u3) * (1 - _g), this[_s17][_c6]);
                                            this[_s17][_c6] = Math.round(10000 * (this[_s17][_c6] - _i14)) / 10000;
                                            var _l5 = Math.min(_n17 * _u3 * (1 - _g), this[_s17 + 1][_c6]);
                                            this[_s17 + 1][_c6] = Math.round(10000 * (this[_s17 + 1][_c6] - _l5)) / 10000;
                                            var _d8 = Math.min(_n17 * (1 - _u3) * _g, this[_s17][_c6 + 1]);
                                            this[_s17][_c6 + 1] = Math.round(10000 * (this[_s17][_c6 + 1] - _d8)) / 10000;
                                            var _M = Math.min(_n17 * _u3 * _g, this[_s17 + 1][_c6 + 1]);
                                            this[_s17 + 1][_c6 + 1] = Math.round(10000 * (this[_s17 + 1][_c6 + 1] - _M)) / 10000;
                                            p += _i14 + _l5 + _d8 + _M;
                                        }
                                        M -= _S2;
                                    }
                                }
                                this.RoundAll();
                            },
                        },
                        {
                            key: 'RoundAll',
                            value: function RoundAll() {
                                for (var _t29 = 0; _t29 < this.length; _t29++) for (var _n18 = 0; _n18 < this[_t29].length; _n18++) this[_t29][_n18] = Math.round(1000 * this[_t29][_n18]) / 1000;
                            },
                        },
                        {
                            key: 'RandomTransformation',
                            value: function RandomTransformation() {
                                return [Math.round(1000 * this.conRand.rnd() * Math.PI) / 1000, Math.round(1000 * (1 + this.conRand.rnd())) / 1000, Math.round(1000 * (1 + this.conRand.rnd())) / 1000];
                            },
                        },
                    ]);
                    return e;
                })(_wrapNativeSuper(Array));
                function r(t, n, s, e, r) {
                    if (s) {
                        return Math.round(1000 * (0.25 + 0.75 * (Math.min(0.5, Math.max(-0.5, i.noise(t, n, r, e))) + 0.5))) / 1000;
                    } else {
                        return 1;
                    }
                }
                t.exports = {
                    Mountain: (function () {
                        function Mountain(t, n, s, i) {
                            _classCallCheck(this, Mountain);
                            var r = R.random_dec();
                            this.t0 = new e(100, 100, r);
                            this.t0.Grow(t, n, s, i, !1);
                            this.t1 = new e(100, 100, r);
                            this.t1.Grow(t, n, s, i, !0);
                            for (var _t30 = 0; _t30 < this.t0.length; _t30++)
                                for (var _n19 = 0; _n19 < this.t0[_t30].length; _n19++) {
                                    TERCHANGE || (this.t1[_t30][_n19] = this.t0[_t30][_n19]);
                                    var _s18 = 0.5 * (this.t0[_t30][_n19] + this.t1[_t30][_n19]);
                                    var _i15 = Math.max(0, Math.min(1, (Math.sqrt(_t30 * _t30 + _n19 * _n19) - 630) / 150));
                                    (MILL && FLATTEN) || (_i15 = 0);
                                    this.t0[_t30][_n19] = this.t0[_t30][_n19] + _i15 * (_s18 - this.t0[_t30][_n19]);
                                    this.t1[_t30][_n19] = this.t1[_t30][_n19] + _i15 * (_s18 - this.t1[_t30][_n19]);
                                }
                            this.c0 = new e(this.t0.length, this.t0[0].length, 0);
                            this.c1 = new e(this.t0.length, this.t0[0].length, 0);
                        }
                        _createClass(Mountain, [
                            {
                                key: 'CalculateLight',
                                value: function CalculateLight() {
                                    for (var _t31 = 0; _t31 < this.c0.length; _t31++)
                                        for (var _n20 = 0; _n20 < this.c0[_t31].length; _n20++) {
                                            var _s19 = 2.5 * (0.4 + 0.6 * this.t0[_t31][_n20]);
                                            this.c0[_t31][_n20] =
                                                0.3 * _s19 * this.t0.Curvature(_t31, _n20, 20) + 0.4 * _s19 * this.t0.Curvature(_t31, _n20, 6) + 3 * _s19 * this.t0.Curvature(_t31, _n20, 0.5);
                                            _s19 = 2.5 * (0.4 + 0.6 * this.t1[_t31][_n20]);
                                            this.c1[_t31][_n20] =
                                                0.3 * _s19 * this.t1.Curvature(_t31, _n20, 20) + 0.4 * _s19 * this.t1.Curvature(_t31, _n20, 6) + 3 * _s19 * this.t1.Curvature(_t31, _n20, 0.5);
                                        }
                                },
                            },
                            {
                                key: 'Evaluate',
                                value: function Evaluate(t, n, s) {
                                    var i = 0;
                                    var e = (2 * (t + S / 2)) % (this.t0.length - 1);
                                    var r = (2 * (n + S / 2)) % (this.t0[0].length - 1);
                                    i = s.terrain < 0.5 ? this.t0.Eval(e, r, !0)[2] : this.t1.Eval(e, r, !0)[2];
                                    return i;
                                },
                            },
                            {
                                key: 'Color',
                                value: function Color(t, n, s) {
                                    var i = 0;
                                    var e = (2 * (t + S / 2)) % (this.c0.length - 1);
                                    var r = (2 * (n + S / 2)) % (this.c0[0].length - 1);
                                    i = s.terrain < 0.5 ? this.c0.Eval(e, r, !0)[2] : this.c1.Eval(e, r, !0)[2];
                                    return i;
                                },
                            },
                        ]);
                        return Mountain;
                    })(),
                    Array2D: e,
                };
            },
            413: function _(t) {
                function n(t) {
                    var n = new Uint32Array(1);
                    n[0] = 1664525 * t[0] + 1013904223;
                    return n;
                }
                var s = (Math.sqrt(4) - 1) / 3;
                var i = (1 / Math.sqrt(4) - 1) / 3;
                function e(t, n, i, e) {
                    return {
                        dx: -n - t * s,
                        dy: -i - t * s,
                        dz: -e - t * s,
                        xsb: n,
                        ysb: i,
                        zsb: e,
                    };
                }
                var r = [
                    [0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1],
                    [2, 1, 1, 0, 2, 1, 0, 1, 2, 0, 1, 1, 3, 1, 1, 1],
                    [1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 2, 1, 1, 0, 2, 1, 0, 1, 2, 0, 1, 1],
                ];
                var h = [
                    -11, 4, 4, -4, 11, 4, -4, 4, 11, 11, 4, 4, 4, 11, 4, 4, 4, 11, -11, -4, 4, -4, -11, 4, -4, -4, 11, 11, -4, 4, 4, -11, 4, 4, -4, 11, -11, 4, -4, -4, 11, -4, -4, 4, -11, 11, 4, -4,
                    4, 11, -4, 4, 4, -11, -11, -4, -4, -4, -11, -4, -4, -4, -11, 11, -4, -4, 4, -11, -4, 4, -4, -11,
                ];
                var o = [
                    0, 2, 1, 1, 2, 2, 5, 1, 6, 0, 7, 0, 32, 2, 34, 2, 129, 1, 133, 1, 160, 5, 161, 5, 518, 0, 519, 0, 546, 4, 550, 4, 645, 3, 647, 3, 672, 5, 673, 5, 674, 4, 677, 3, 678, 4, 679, 3,
                    680, 13, 681, 13, 682, 12, 685, 14, 686, 12, 687, 14, 712, 20, 714, 18, 809, 21, 813, 23, 840, 20, 841, 21, 1198, 19, 1199, 22, 1226, 18, 1230, 19, 1325, 23, 1327, 22, 1352, 15,
                    1353, 17, 1354, 15, 1357, 17, 1358, 16, 1359, 16, 1360, 11, 1361, 10, 1362, 11, 1365, 10, 1366, 9, 1367, 9, 1392, 11, 1394, 11, 1489, 10, 1493, 10, 1520, 8, 1521, 8, 1878, 9, 1879,
                    9, 1906, 7, 1910, 7, 2005, 6, 2007, 6, 2032, 8, 2033, 8, 2034, 7, 2037, 6, 2038, 7, 2039, 6,
                ];
                var a = [
                    0, 0, 1, -1, 0, 0, 1, 0, -1, 0, 0, -1, 1, 0, 0, 0, 1, -1, 0, 0, -1, 0, 1, 0, 0, -1, 1, 0, 2, 1, 1, 0, 1, 1, 1, -1, 0, 2, 1, 0, 1, 1, 1, -1, 1, 0, 2, 0, 1, 1, 1, -1, 1, 1, 1, 3, 2,
                    1, 0, 3, 1, 2, 0, 1, 3, 2, 0, 1, 3, 1, 0, 2, 1, 3, 0, 2, 1, 3, 0, 1, 2, 1, 1, 1, 0, 0, 2, 2, 0, 0, 1, 1, 0, 1, 0, 2, 0, 2, 0, 1, 1, 0, 0, 1, 2, 0, 0, 2, 2, 0, 0, 0, 0, 1, 1, -1, 1,
                    2, 0, 0, 0, 0, 1, -1, 1, 1, 2, 0, 0, 0, 0, 1, 1, 1, -1, 2, 3, 1, 1, 1, 2, 0, 0, 2, 2, 3, 1, 1, 1, 2, 2, 0, 0, 2, 3, 1, 1, 1, 2, 0, 2, 0, 2, 1, 1, -1, 1, 2, 0, 0, 2, 2, 1, 1, -1, 1,
                    2, 2, 0, 0, 2, 1, -1, 1, 1, 2, 0, 0, 2, 2, 1, -1, 1, 1, 2, 0, 2, 0, 2, 1, 1, 1, -1, 2, 2, 0, 0, 2, 1, 1, 1, -1, 2, 0, 2, 0,
                ];
                t.exports = {
                    makeNoise3D: function makeNoise3D(t) {
                        var l = [];
                        for (var _t32 = 0; _t32 < a.length; _t32 += 9) {
                            var _n21 = r[a[_t32]];
                            var _s20 = null;
                            var _i16 = null;
                            for (var _r7 = 0; _r7 < _n21.length; _r7 += 4)
                                ((_i16 = e(_n21[_r7], _n21[_r7 + 1], _n21[_r7 + 2], _n21[_r7 + 3])), null === _s20 ? (l[_t32 / 9] = _i16) : (_s20.next = _i16), (_s20 = _i16));
                            _i16.next = e(a[_t32 + 1], a[_t32 + 2], a[_t32 + 3], a[_t32 + 4]);
                            _i16.next.next = e(a[_t32 + 5], a[_t32 + 6], a[_t32 + 7], a[_t32 + 8]);
                        }
                        var d = [];
                        for (var _t33 = 0; _t33 < o.length; _t33 += 2) d[o[_t33]] = l[o[_t33 + 1]];
                        var c = new Uint8Array(256);
                        var u = new Uint8Array(256);
                        var f = new Uint8Array(256);
                        for (var _t34 = 0; _t34 < 256; _t34++) f[_t34] = _t34;
                        var M = new Uint32Array(1);
                        M[0] = t;
                        M = n(n(n(M)));
                        for (var _t35 = 255; _t35 >= 0; _t35--) {
                            M = n(M);
                            var _s21 = new Uint32Array(1);
                            _s21[0] = (M[0] + 31) % (_t35 + 1);
                            if (_s21[0] < 0) {
                                _s21[0] += _t35 + 1;
                            }
                            c[_t35] = f[_s21[0]];
                            u[_t35] = (c[_t35] % 24) * 3;
                            f[_s21[0]] = f[_t35];
                        }
                        return function (t, n, e) {
                            var r = (t + n + e) * i;
                            var o = t + r;
                            var a = n + r;
                            var l = e + r;
                            var f = Math.floor(o);
                            var M = Math.floor(a);
                            var p = Math.floor(l);
                            var g = (f + M + p) * s;
                            var m = t - (f + g);
                            var C = n - (M + g);
                            var S = e - (p + g);
                            var R = o - f;
                            var x = a - M;
                            var y = l - p;
                            var w = R + x + y;
                            var E = 0;
                            for (var _t36 = d[(x - y + 1) | ((R - x + 1) << 1) | ((R - y + 1) << 2) | (w << 3) | ((w + y) << 5) | ((w + x) << 7) | ((w + R) << 9)]; void 0 !== _t36; _t36 = _t36.next) {
                                var _n22 = m + _t36.dx;
                                var _s22 = C + _t36.dy;
                                var _i17 = S + _t36.dz;
                                var _e17 = 2 - _n22 * _n22 - _s22 * _s22 - _i17 * _i17;
                                if (_e17 > 0) {
                                    var _r8 = f + _t36.xsb;
                                    var _o7 = M + _t36.ysb;
                                    var _a6 = p + _t36.zsb;
                                    var _l6 = c[255 & _r8];
                                    var _d9 = c[(_l6 + _o7) & 255];
                                    var _g2 = u[(_d9 + _a6) & 255];
                                    E += _e17 * _e17 * _e17 * _e17 * (h[_g2] * _n22 + h[_g2 + 1] * _s22 + h[_g2 + 2] * _i17);
                                }
                            }
                            return 0.009708737864077669 * E;
                        };
                    },
                };
            },
            479: function _(t, n, s) {
                var i = s(555);
                var e = new i.myRandom(0);
                function r(t, n, s, i, r, h) {
                    if (
                        (t * r + h > FRAME - r && t * r - h < FRAME - r) ||
                        (n * r + h > FRAME - r && n * r - h < FRAME - r) ||
                        (t * r + h > s * r - FRAME && t * r - h < s * r - FRAME) ||
                        (n * r + h > i * r - FRAME && n * r - h < i * r - FRAME)
                    ) {
                        return 0.1 + 0.4 * e.rnd();
                    } else {
                        return 0;
                    }
                }
                function h(t, n) {
                    if (3 == t[3]) {
                        return n < 0.5 || n > 1.1;
                    } else {
                        if (t[3] == (STRIPES > 0.5 ? 2 : 1)) {
                            return n < 0.6 || n > 1.1;
                        } else {
                            return 0 == t[3] && 2 * t[5] < t[2] / U - 0.1;
                        }
                    }
                }
                function o(t, n, s) {
                    var i = t % n;
                    if (i < s || i > n - s) {
                        return 0.1 + 0.35 * e.rnd();
                    } else {
                        return 0;
                    }
                }
                function a(t, n, s) {
                    if (0 == t[3] || 3 == t[3]) {
                        return Math.max(o(t[0], n, s), o(t[1], n, s));
                    } else {
                        return 0;
                    }
                }
                function l(t, n) {
                    if (0 == t[3] || 3 == t[3]) {
                        return 0;
                    }
                    var s = Math.floor((t[0] + 0.1) / S);
                    var r = Math.floor((t[1] + 0.1) / S);
                    var h = Math.floor((t[2] + 0.1 + Z) / S);
                    var o = 1 + 0.6 * Math.round(0.5 + 0.5 * i.noise(s, r, h, 0.23));
                    var a = t[0] + 100 * t[1];
                    var l = t[2] + Z;
                    if (1 == t[3]) {
                        a = 100 * t[0] + t[1] + 100 * S;
                    }
                    var d = (a + 0.4 * n * (e.rnd() - 0.5)) % o;
                    var c = (l + 0.4 * n * (e.rnd() - 0.5)) % 2;
                    var u = Math.floor(a / o);
                    var f = Math.floor(l / 2);
                    if (c + t[5] < 3) {
                        return 0;
                    }
                    var M = 1.2 * (0.12 + 0.12 * Math.round(0.5 + 0.5 * i.noise(u, f, 0, 1.3)));
                    var p = 0.25 + 0.4 * Math.round(0.5 + 0.5 * i.noise(u, f, 77, 0.73));
                    if (d < M) {
                        return 0;
                    }
                    if (d > o - M) {
                        return 0;
                    }
                    if (c < p) {
                        return 0;
                    }
                    if (c > 1.5) {
                        return 0;
                    }
                    if (i.noise(u, f, 11, 6.73) < 0.15) {
                        return 0;
                    }
                    return (i.noise(u, f, -11, 4.73) > 0.4 ? 1 : -0.75) * (0.6 + (0.3 * Math.round(0.5 + 0.5 * i.noise(u, f, -111, 7.73))) / 2) * (0.5 + 0.5 * e.rnd());
                }
                function d(t, n) {
                    var s = Math.floor(2 * t[0]);
                    var r = Math.floor(2 * t[1]);
                    var h = Math.floor(2 * (t[2] + Z));
                    var o = 0;
                    var a = 0;
                    var l = 0;
                    if (0 == n || 3 == n) {
                        if (Ztype > 0.5) {
                            l = t[0];
                            o = h;
                            a = r;
                        } else {
                            l = t[1];
                            o = s;
                            a = h;
                        }
                    } else {
                        if (2 == n) {
                            if (XYtype > 0.5) {
                                l = t[0];
                                o = r;
                                a = h;
                            } else {
                                l = t[2];
                                o = s;
                                a = r;
                            }
                        } else {
                            if (XYtype > 0.5) {
                                l = t[1];
                                o = h;
                                a = s;
                            } else {
                                l = t[2];
                                o = r;
                                a = s;
                            }
                        }
                    }
                    return e.rnd() - 0.5 + 0.15 * Math.sin(0.125 * l + 3 * Math.floor(0.2 * l * i.noise(o, a, 0, 2134.567)) + 122 * i.noise(o, 0, a, 2134.567));
                }
                t.exports = {
                    renderLight: function renderLight(t, n, c, u, f) {
                        if (0 == t) {
                            mainCtx.fillStyle = '#000000';
                            mainCtx.fillRect(-10, -10, u + 20, f + 20);
                        }
                        var M = Math.floor(t / 2) % 2 == 0;
                        var p = (t % 2) % 2 == 0;
                        e = new i.myRandom(t);
                        var g = Math.floor(t / 4);
                        var m = CAM.planeY;
                        var C = CAM.planeX;
                        var R = CAM.GetVector();
                        var x = Math.max(10, Math.round(1000000 / u));
                        var y = Math.ceil(f / x);
                        var w = 0;
                        var E = f;
                        var b = Math.round(u / 2);
                        var A = -b;
                        var L = Math.round(f / 2);
                        for (var v = 0; v < y; v++) {
                            var B = Math.min(x, E);
                            try {
                                console.log('rendering pass ' + (t + 1) + ', fragment ' + (v + 1) + '/' + y);
                            } catch (_unused5) {}
                            w += B;
                            E -= B;
                            var P = mainCtx.getImageData(0, E, u, B);
                            var O = P.data;
                            var I = -L + w - B;
                            var G = -L + w;
                            for (var _t37 = A; _t37 < b; _t37++) {
                                var _x = _t37 + b;
                                if ((!M || _x % 2 != 1) && (M || _x % 2 != 0)) {
                                    for (var _M2 = I; _M2 < G; _M2++) {
                                        var _y = _M2 + L;
                                        if (p && _y % 2 == 1) {
                                            continue;
                                        }
                                        if (!p && _y % 2 == 0) {
                                            continue;
                                        }
                                        var _w = i.addVec(CAM.planeO, C, c * (_t37 + e.rnd()));
                                        _w = i.addVec(_w, m, SQUEEZE * c * (_M2 + e.rnd()));
                                        var _b = i.getColorIndices(_x, _y, u, f, E);
                                        var _A = [O[_b[0]], O[_b[1]], O[_b[2]]];
                                        var _v = [0, 0, 0];
                                        s.g.D = 1;
                                        var _B = i.Trace(_w, R, n, !1, !1);
                                        var _P = i.IsFrame(_x, _y, u, f, c, 0);
                                        if (null == _B || _P) {
                                            var _t38 = i.RayPlane([0, 0, -Z], [0, 0, 1], _w, R);
                                            if (_t38[3]) {
                                                _B = [_t38[0], _t38[1], _t38[2], 3, _P ? 500 : _t38[4], 200];
                                            }
                                        }
                                        if (null != _B) {
                                            var _t39 = [0, 0, 0];
                                            _t39 = 0 == _B[3] ? i.addVec(_B, [0, 0, 1], 0.045 * S * e.rnd() + 0.05) : i.addVec(_B, R, -0.02 * S * e.rnd() - 0.02);
                                            var _n23 = 0;
                                            DMAP.WriteN(_P ? 0 : _B[4], _x / u, _y / f);
                                            var _M3 = 0.2 * (_P ? 0 : 1 - (_B[2] + Z + 12) / (Z + U + 25)) + 0.9 * Math.min(1, Math.max(0, _B[4] - 410) / 370);
                                            s.g.D = 8;
                                            for (var _s23 = 0; _s23 < 2; _s23++)
                                                if (e.rnd() > 0.2 + 0.8 * _M3 && !_P) {
                                                    var _s24 = i.Trace(_t39, i.RotateXZ(LV[0], LV[1], LV[2], 0.2 * (e.rnd() - 0.5), 0.15 * (e.rnd() - 0.5)), 0.2 * T, !0, !0);
                                                    _n23 += null != _s24 ? (1.25 * Math.min(1, _s24[0] / (0.2 * T)) + 0.125) / 2 : 0.5675;
                                                } else {
                                                    _n23 += _P ? 0.75 - 0.4 * Math.pow(e.rnd(), 2) : 0.06 * e.rnd() + 0.12;
                                                }
                                            _P || 3 != _B[3] || (_n23 *= 1.1 + 0.2 * e.rnd());
                                            _n23 += l(_B, 0.1 + 0.4 * _M3) * (1.3 - 0.5 * _M3);
                                            if (!_P && h(_B, _n23)) {
                                                _n23 -= 2 * o(_B[STRIPES > 0.5 ? 0 : 1], S / 16, 0.08);
                                            }
                                            if (!_P && GRID) {
                                                _n23 -= a(_B, S, 0.125) * (SMGRID ? 0.5 : 1);
                                            }
                                            if (!_P && SMGRID) {
                                                _n23 -= 0.8 * a(_B, S / 2, 0.125);
                                            }
                                            _n23 -= 2 * r(_x, _y, u, f, c, 0.125);
                                            var _p = (1 - 0.2 * _n23) * d(_B, _B[3]) * (1 - _M3);
                                            var _g3 = 0 == _B[3] ? 1.125 * (_n23 + 0.125 + 0.3 * _p) : 1.125 * (_n23 + 0.3 * _p);
                                            if (0 == _B[3]) {
                                                _g3 = 1.22 * _g3 + (0.5 + e.rnd()) * _B[5];
                                            }
                                            _P || (_g3 = 1.35 * _g3 - 0.1);
                                            var _m = [TERCLR[0], TERCLR[1], TERCLR[2]];
                                            if (0 != _B[3]) {
                                                _m = [CUTCLR[0], CUTCLR[1], CUTCLR[2]];
                                            }
                                            var _C = _P ? 0.3 : _M3 / 1.5;
                                            var _w2 = 3 == _B[3] ? 125 : 155;
                                            _m[0] += _C * (_w2 - _m[0]);
                                            _m[1] += _C * (_w2 - _m[1]);
                                            _m[2] += _C * (_w2 - _m[2]);
                                            _v = [_m[0] * _g3, _m[1] * _g3, _m[2] * _g3];
                                        }
                                        O[_b[0]] = (g * _A[0]) / (g + 1) + _v[0] / (g + 1);
                                        O[_b[1]] = (g * _A[1]) / (g + 1) + _v[1] / (g + 1);
                                        O[_b[2]] = (g * _A[2]) / (g + 1) + _v[2] / (g + 1);
                                    }
                                }
                            }
                            mainCtx.putImageData(P, 0, E);
                        }
                    },
                };
            },
            555: function _(t, n, s) {
                var i = s(937);
                var e;
                function r(t) {
                    var n = Math.round(Math.min(255, Math.max(0, t))).toString(16);
                    if (1 == n.length) {
                        return '0' + n;
                    } else {
                        return n;
                    }
                }
                function h(t, n, s) {
                    var i = Math.sin(s);
                    var e = Math.cos(s);
                    return [t * e - n * i, t * i + n * e];
                }
                function o(t) {
                    var n = Math.floor(t[0] / S);
                    if (n < 0 || n >= BLOCKS.length) {
                        return null;
                    }
                    var s = Math.floor(t[1] / S);
                    if (s < 0 || s >= BLOCKS[n].length) {
                        return null;
                    }
                    var i = Math.floor((t[2] + Z) / S);
                    if (i < 0 || i >= BLOCKS[n][s].length) {
                        return null;
                    }
                    var e = BLOCKS[n][s][i];
                    if (e.isEmpty) {
                        return null;
                    } else {
                        return e;
                    }
                }
                function a(t, n, s, i, e, r, h) {
                    return !(t[0] < n - 0.01) && !(t[1] < i - 0.01) && !(t[2] < r - 0.01) && !(t[0] > s + 0.01) && !(t[1] > e + 0.01) && !(t[2] > h + 0.01);
                }
                function l(t, n, s, i) {
                    var e = d(i, n);
                    if (Math.abs(e) <= 0.0001) {
                        return [0, 0, 0, !1, -10];
                    }
                    var r = d([t[0] - s[0], t[1] - s[1], t[2] - s[2]], n) / e;
                    return [s[0] + r * i[0], s[1] + r * i[1], s[2] + r * i[2], !0, r];
                }
                function d(t, n) {
                    var s = Math.min(t.length, n.length);
                    var i = 0;
                    for (var _e18 = 0; _e18 < s; _e18++) i += t[_e18] * n[_e18];
                    return i;
                }
                function c(t, n, s, i) {
                    var e = h(t, n, i);
                    return [e[0], e[1], s];
                }
                function u(t, n, s, i, e) {
                    var r = (function (t, n, s, i) {
                        var e = h(n, s, i);
                        return [t, e[0], e[1]];
                    })(t, n, s, i);
                    return c(r[0], r[1], r[2], e);
                }
                function f(t, n, s) {
                    return [t[0] + s * n[0], t[1] + s * n[1], t[2] + s * n[2]];
                }
                function M(t, n, s) {
                    var i = [];
                    for (var _e19 = 0; _e19 < Math.min(3, t.length); _e19++) i.push(t[_e19] + s * (n[_e19] - t[_e19]));
                    return i;
                }
                t.exports = {
                    SetSimplex: function SetSimplex(t) {
                        e = t;
                    },
                    noise: function noise(t, n, s, i) {
                        return Math.round(1000 * e(Math.round(1000 * i * t) / 1000, Math.round(1000 * i * n) / 1000, Math.round(1000 * i * s) / 1000)) / 1000;
                    },
                    Distance: function Distance(t, n) {
                        return Math.sqrt(Math.pow(n[0] - t[0], 2) + Math.pow(n[1] - t[1], 2) + Math.pow(n[2] - t[2], 2));
                    },
                    GetBlock: o,
                    RayPlane: l,
                    IsVis: function IsVis(t, n, s) {
                        return DMAP.ReadN(t[0] / n, (s - t[1]) / s) > t[2] - 0.1;
                    },
                    normalize: function normalize(t) {
                        var n = t[0];
                        var s = t[1];
                        var i = t[2];
                        var e = Math.sqrt(n * n + s * s + i * i);
                        if (e > 0.001) {
                            n /= e;
                            s /= e;
                            i /= e;
                            return [n, s, i];
                        } else {
                            return [0, 0, 0];
                        }
                    },
                    clamp: function clamp(t, n) {
                        var s = t[0];
                        var i = t[1];
                        var e = t[2];
                        var r = Math.sqrt(s * s + i * i + e * e);
                        if (r > n) {
                            s *= n / r;
                            i *= n / r;
                            e *= n / r;
                            return [s, i, e];
                        } else {
                            return [s, i, e];
                        }
                    },
                    CrossProduct: function CrossProduct(t, n) {
                        return [t[1] * n[2] - t[2] * n[1], t[2] * n[0] - t[0] * n[2], t[0] * n[1] - t[1] * n[0]];
                    },
                    lerp: M,
                    IsFrame: function IsFrame(t, n, s, i, e, r) {
                        return t * e < FRAME + r - e || n * e < FRAME + r - e || t * e >= s * e - FRAME - r || n * e >= i * e - FRAME - r;
                    },
                    Rotate: h,
                    RotateZ: c,
                    RotateXZ: u,
                    addVec: f,
                    hashColor: function hashColor(t) {
                        return '#' + r(t[0]) + r(t[1]) + r(t[2]) + r(255 * t[3]);
                    },
                    getColorIndices: function getColorIndices(t, n, s, i, e) {
                        var r = 4 * s * (i - 1 - n - e) + 4 * t;
                        return [r, r + 1, r + 2, r + 3];
                    },
                    Trace: function Trace(t, n, s, i, e) {
                        var r = 0;
                        r = n[0] >= 0 ? Math.max(Math.floor((t[0] + 0.001) / S) * S, 0) : Math.max(0, Math.floor((t[0] + 0.001 - s) / S) * S);
                        var h = 0;
                        if (((h = n[0] <= 0 ? Math.min(Math.ceil((t[0] - 0.001) / S) * S, T) : Math.min(T, Math.ceil((t[0] - 0.001 + s) / S) * S)), h - r <= 0.001)) {
                            return null;
                        }
                        var d = 0;
                        d = n[1] >= 0 ? Math.max(Math.floor((t[1] + 0.001) / S) * S, 0) : Math.max(0, Math.floor((t[1] + 0.001 - s) / S) * S);
                        var c = 0;
                        if (((c = n[1] <= 0 ? Math.min(Math.ceil((t[1] - 0.001) / S) * S, T) : Math.min(T, Math.ceil((t[1] - 0.001 + s) / S) * S)), c - d <= 0.001)) {
                            return null;
                        }
                        var u = 0;
                        u = n[2] >= 0 ? Math.max(Math.floor((t[2] + 0.001) / S) * S, -Z) : Math.max(-Z, Math.floor((t[2] + 0.001 - s) / S) * S);
                        var f = 0;
                        if (((f = n[2] <= 0 ? Math.min(Math.ceil((t[2] - 0.001) / S) * S, U) : Math.min(U, Math.ceil((t[2] - 0.001 + s) / S) * S)), f - u <= 0.001)) {
                            return null;
                        }
                        var p = new Array();
                        if (i) {
                            p.push([t[0], t[1], t[2], !0, -1]);
                        }
                        for (var _s25 = d; _s25 < c + 1; _s25 += c - d) {
                            var _i18 = l([0, _s25, 0], [0, -1, 0], t, n);
                            if (_i18[3]) {
                                _i18[4] <= 0 || (a(_i18, r, h, d, c, u, f) && p.push(_i18));
                            }
                        }
                        for (var _s26 = r; _s26 < h + 1; _s26 += h - r) {
                            var _i19 = l([_s26, 0, 0], [-1, 0, 0], t, n);
                            if (_i19[3]) {
                                _i19[4] <= 0 || (a(_i19, r, h, d, c, u, f) && p.push(_i19));
                            }
                        }
                        for (var _s27 = u; _s27 < f + 1; _s27 += f - u) {
                            var _i20 = l([0, 0, _s27], [0, 0, 1], t, n);
                            if (_i20[3]) {
                                _i20[4] <= 0 || (a(_i20, r, h, d, c, u, f) && p.push(_i20));
                            }
                        }
                        if (p.length < 2) {
                            return null;
                        }
                        var g = 9999;
                        var m = -9999;
                        var C = 9999;
                        var R = -9999;
                        var x = 9999;
                        var y = -9999;
                        for (var _t40 = 0; _t40 < p.length; _t40++) {
                            var _n24 = p[_t40][0];
                            var _s28 = p[_t40][1];
                            var _i21 = p[_t40][2];
                            if (g > _n24) {
                                g = _n24;
                            }
                            if (C > _s28) {
                                C = _s28;
                            }
                            if (x > _i21) {
                                x = _i21;
                            }
                            if (m < _n24) {
                                m = _n24;
                            }
                            if (R < _s28) {
                                R = _s28;
                            }
                            if (y < _i21) {
                                y = _i21;
                            }
                        }
                        g = Math.floor((g + 0.01) / S) * S;
                        C = Math.floor((C + 0.01) / S) * S;
                        x = Math.floor((x + 0.01) / S) * S;
                        m = Math.ceil((m - 0.01) / S) * S;
                        R = Math.ceil((R - 0.01) / S) * S;
                        y = Math.ceil((y - 0.01) / S) * S;
                        var w = new Array();
                        for (var _t41 = 0; _t41 < p.length; _t41++) w.push(p[_t41]);
                        for (var _i22 = C; _i22 < R + 1; _i22 += S) {
                            if (_i22 == d || _i22 == c) {
                                continue;
                            }
                            var _e20 = l([0, _i22, 0], [0, -1, 0], t, n);
                            if (_e20[3]) {
                                _e20[4] <= 0 || _e20[4] > s || (a(_e20, g, m, C, R, x, y) && w.push(_e20));
                            }
                        }
                        for (var _i23 = g; _i23 < m + 1; _i23 += S) {
                            if (_i23 == r || _i23 == h) {
                                continue;
                            }
                            var _e21 = l([_i23, 0, 0], [-1, 0, 0], t, n);
                            if (_e21[3]) {
                                _e21[4] <= 0 || _e21[4] > s || (a(_e21, g, m, C, R, x, y) && w.push(_e21));
                            }
                        }
                        for (var _i24 = x; _i24 < y + 1; _i24 += S) {
                            if (_i24 == u || _i24 == f) {
                                continue;
                            }
                            var _e22 = l([0, 0, _i24], [0, 0, 1], t, n);
                            if (_e22[3]) {
                                _e22[4] <= 0 || _e22[4] > s || (a(_e22, g, m, C, R, x, y) && w.push(_e22));
                            }
                        }
                        if (w.length < 2) {
                            return null;
                        }
                        w.sort(function (t, n) {
                            return t[4] - n[4];
                        });
                        for (var _t42 = 0; _t42 < w.length - 1; _t42++) {
                            var _n25 = o(M(w[_t42], w[_t42 + 1], 0.5));
                            if (null != _n25) {
                                var _s29 = _n25.Intersect(w[_t42], w[_t42 + 1], e, w[_t42][4]);
                                if (null != _s29) {
                                    return _s29;
                                }
                            }
                        }
                        return null;
                    },
                    Diag: function Diag(t, n, s, i) {
                        if (BLOCKS[t + i[0]][n + i[1]][s + i[2]].isEmpty) {
                            return !1;
                        }
                        for (var _e23 = 0; _e23 < i.length; _e23++) {
                            var _r9 = [i[0], i[1], i[2]];
                            for (var _t43 = 0; _t43 < _r9.length; _t43++)
                                if (_e23 != _t43) {
                                    _r9[_t43] = 0;
                                }
                            if ((0 != _r9[0] || 0 != _r9[1] || 0 != _r9[2]) && !BLOCKS[t + _r9[0]][n + _r9[1]][s + _r9[2]].isEmpty) {
                                return !1;
                            }
                        }
                        return !0;
                    },
                    myRandom: (function () {
                        function myRandom(t) {
                            _classCallCheck(this, myRandom);
                            this.rng = new i.impl(t);
                        }
                        _createClass(myRandom, [
                            {
                                key: 'rnd',
                                value: function rnd() {
                                    return this.rng.double();
                                },
                            },
                        ]);
                        return myRandom;
                    })(),
                    Camera: (function () {
                        function Camera(t, n, s, i, e) {
                            _classCallCheck(this, Camera);
                            this.planeO = [t, n, s];
                            this.planeX = u(1, 0, 0, i, e);
                            this.planeY = u(0, 1, 0, i, e);
                            this.planeZ = u(0, 0, 1, i, e);
                        }
                        _createClass(Camera, [
                            {
                                key: 'MoveBack',
                                value: function MoveBack(t) {
                                    this.planeO = f(this.planeO, this.planeZ, t);
                                },
                            },
                            {
                                key: 'GetVector',
                                value: function GetVector() {
                                    return [-this.planeZ[0], -this.planeZ[1], -this.planeZ[2]];
                                },
                            },
                            {
                                key: 'ScreenP',
                                value: function ScreenP(t, n, s, i) {
                                    var e = [t[0] - this.planeO[0], t[1] - this.planeO[1], t[2] - this.planeO[2]];
                                    return [s / 2 + d(e, this.planeX) / n, i / 2 - d(e, this.planeY) / (n * SQUEEZE), -d(e, this.planeZ)];
                                },
                            },
                        ]);
                        return Camera;
                    })(),
                };
            },
        },
        n = {};
    function s(i) {
        var e = n[i];
        if (void 0 !== e) {
            return e.exports;
        }
        var r = (n[i] = { exports: {} });
        t[i](r, r.exports, s);
        return r.exports;
    }
    s.n = function (t) {
        var n =
            t && t.__esModule
                ? function () {
                      return t.default;
                  }
                : function () {
                      return t;
                  };
        s.d(n, { a: n });
        return n;
    };
    s.d = function (t, n) {
        for (var i in n)
            if (s.o(n, i) && !s.o(t, i)) {
                Object.defineProperty(t, i, {
                    enumerable: !0,
                    get: n[i],
                });
            }
    };
    s.g = (function () {
        if ('object' == (typeof globalThis === 'undefined' ? 'undefined' : _typeof(globalThis))) {
            return globalThis;
        }
        try {
            return this || new Function('return this')();
        } catch (t) {
            if ('object' == (typeof window === 'undefined' ? 'undefined' : _typeof(window))) {
                return window;
            }
        }
    })();
    s.o = function (t, n) {
        return Object.prototype.hasOwnProperty.call(t, n);
    };
    (function () {
        var t = s(824);
        var n = s(80);
        var i = s(558);
        var e = s(569);
        var r = s(374);
        var h = s(413);
        var o = s(479);
        var a = s(555);
        try {
            if (0 == parseInt(tokenData.tokenId) % 1000000) {
                tokenData.hash = '0xa313d17667adeec2cb2d6f2ec328af6e1db15588c007cbd95bca700bcf1e317f';
            }
            console.log('Seed: ' + tokenData.hash);
        } catch (_unused6) {}
        s.g.R = new t.Random();
        s.g.U = 80;
        s.g.S = 8;
        s.g.T = 392;
        s.g.D = 1.5;
        s.g.Z = S;
        s.g.TERCHANGE = R.random_dec() < 0.6;
        s.g.FLATTEN = R.random_dec() < 0.4;
        s.g.STRIPES = Math.round(R.random_dec());
        s.g.MILL = R.random_dec() > 0.36;
        MILL || (s.g.TERCHANGE = !0);
        var l = [
            ['graphite', [45, 48, 53], [214, 196, 188]],
            ['crimson', [75, 43, 43], [255, 204, 185]],
            ['goldblack', [65, 62, 54], [226, 193, 142]],
            ['blackAndWhite', [48, 48, 48], [230, 230, 230]],
            ['darkgreen', [48, 60, 58], [203, 197, 196]],
            ['sepia', [64, 57, 47], [255, 229, 192]],
        ];
        var d = Math.min(l.length - 1, Math.max(0, Math.floor(0.99 * l.length * R.random_dec())));
        l[d][0];
        s.g.TERCLR = l[d][1];
        s.g.CUTCLR = l[d][2];
        try {
            document.body.style.backgroundColor = '#000000';
        } catch (_unused7) {}
        s.g.CAMTYPE = Math.max(0, Math.floor(1.4 * R.random_dec()));
        s.g.FRAME = 2;
        s.g.XYtype = Math.round(R.random_dec());
        s.g.Ztype = Math.round(R.random_dec());
        s.g.GRID = R.random_dec() > 0.35;
        s.g.SMGRID = R.random_dec() > 0.35;
        var c = 0;
        var u = R.random_dec();
        c = 0 == CAMTYPE ? (u < 0.5 ? 0.4 - 1.1 * u : -0.35 - 1.1 * (u - 0.5)) : 0.33 - 1.17 * u;
        if (c >= 0 && c < 0.1) {
            c = 0.1;
        }
        if (c < 0 && c > -0.1) {
            c = -0.1;
        }
        if (c >= -0.5 && c < -0.4) {
            c = -0.4;
        }
        if (c < -0.5 && c > -0.6) {
            c = -0.6;
        }
        s.g.LV = (0, a.RotateXZ)(0, 1, 0, 0.29, c * Math.PI);
        var f = Math.PI / 4;
        var M = -Math.PI / 4;
        s.g.IMG = 88 * Math.SQRT2;
        s.g.SQUEEZE = 1;
        if (1 == CAMTYPE) {
            s.g.IMG = 112;
            M = 0;
            s.g.SQUEEZE = 0.99;
        }
        s.g.FRAME = (FRAME * IMG) / 128;
        s.g.SQUEEZE *= (-2 * FRAME + (16 * (IMG + 2 * FRAME)) / 9) / ((16 * IMG) / 9);
        s.g.IMG += 2 * FRAME;
        s.g.CAM = new a.Camera(-S / 2 + T / 2, S / 2 + T / 2, 0, f, M);
        CAM.MoveBack(500);
        s.g.landscape = null;
        s.g.DMAP = null;
        s.g.BLOCKS = new Array();
        var p = !1;
        for (; !p; )
            try {
                (0, a.SetSimplex)((0, h.makeNoise3D)(Math.round(10000 * R.random_dec())));
                var _t44 = Math.round(1000 * (0.02 + 0.05 * R.random_dec())) / 1000;
                var _o8 = Math.round(100000 * R.random_dec()) / 1000;
                var _l7 = Math.round(1000 * (0.02 + 0.05 * R.random_dec())) / 1000;
                var _d10 = Math.round(100000 * R.random_dec()) / 1000;
                s.g.landscape = new r.Mountain(_l7, _d10, _t44, _o8);
                s.g.BLOCKS = new Array();
                for (var _t45 = 0; _t45 < T - S; _t45 += S) {
                    var _s30 = new Array();
                    for (var _i25 = 0; _i25 < T - S; _i25 += S) {
                        var _e24 = new Array();
                        for (var _s31 = -Z; _s31 < U; _s31 += S) _e24.push(new n.BBlock(_t45, _i25, _s31, S));
                        _s30.push(_e24);
                    }
                    BLOCKS.push(_s30);
                }
                var _c7 = 1 - Math.round(R.random_dec());
                var _u4 = R.random_dec() < 0.5;
                if (((0, i.GrowBoxes)([(5 + (_u4 ? _c7 : 0)) * S, (5 + (_u4 ? 0 : _c7)) * S, 4 * S]), (0, i.ClearBoxes)(), !MILL)) {
                    var _iterator9 = _createForOfIteratorHelper(BLOCKS);
                    var _step9;
                    try {
                        for (_iterator9.s(); !(_step9 = _iterator9.n()).done; ) {
                            var _t46 = _step9.value;
                            var _iterator10 = _createForOfIteratorHelper(_t46);
                            var _step10;
                            try {
                                for (_iterator10.s(); !(_step10 = _iterator10.n()).done; ) {
                                    var _n26 = _step10.value;
                                    var _iterator11 = _createForOfIteratorHelper(_n26);
                                    var _step11;
                                    try {
                                        for (_iterator11.s(); !(_step11 = _iterator11.n()).done; ) {
                                            var _t47 = _step11.value;
                                            if (_t47.isEmpty) {
                                                _t47.isEmpty = !1;
                                                _t47.terrain = 1;
                                            }
                                        }
                                    } catch (err) {
                                        _iterator11.e(err);
                                    } finally {
                                        _iterator11.f();
                                    }
                                }
                            } catch (err) {
                                _iterator10.e(err);
                            } finally {
                                _iterator10.f();
                            }
                        }
                    } catch (err) {
                        _iterator9.e(err);
                    } finally {
                        _iterator9.f();
                    }
                }
                var _f4 = !0;
                var _M4 = 0;
                for (; _f4 && _M4 < 1000; ) {
                    _f4 = !1;
                    var _iterator12 = _createForOfIteratorHelper(BLOCKS);
                    var _step12;
                    try {
                        for (_iterator12.s(); !(_step12 = _iterator12.n()).done; ) {
                            var _t49 = _step12.value;
                            var _iterator13 = _createForOfIteratorHelper(_t49);
                            var _step13;
                            try {
                                for (_iterator13.s(); !(_step13 = _iterator13.n()).done; ) {
                                    var _n28 = _step13.value;
                                    for (var _t50 = 0; _t50 < _n28.length; _t50++)
                                        (0 == _M4 && _n28[_t50].Resolve(),
                                            _n28[_t50].isEmpty ||
                                                (_n28[_t50].hasTerrain &&
                                                    _n28[_t50].isThin &&
                                                    0 != _t50 &&
                                                    (_n28[_t50 - 1].isEmpty || _n28[_t50 - 1].isFlat || (_n28[_t50].terrain != _n28[_t50 - 1].terrain && _n28[_t50 - 1].hasTerrain)) &&
                                                    ((_n28[_t50].isEmpty = !0), (_f4 = !0))));
                                }
                            } catch (err) {
                                _iterator13.e(err);
                            } finally {
                                _iterator13.f();
                            }
                        }
                    } catch (err) {
                        _iterator12.e(err);
                    } finally {
                        _iterator12.f();
                    }
                    for (var _t48 = 1; _t48 < BLOCKS.length - 1; _t48++)
                        for (var _n27 = 1; _n27 < BLOCKS[_t48].length - 1; _n27++)
                            for (var _s32 = 1; _s32 < BLOCKS[_t48][_n27].length - 1; _s32++)
                                BLOCKS[_t48][_n27][_s32].isEmpty ||
                                    BLOCKS[_t48][_n27][_s32].isTip ||
                                    (((0, a.Diag)(_t48, _n27, _s32, [1, 1, 0]) ||
                                        (0, a.Diag)(_t48, _n27, _s32, [1, -1, 0]) ||
                                        (0, a.Diag)(_t48, _n27, _s32, [1, 0, 1]) ||
                                        (0, a.Diag)(_t48, _n27, _s32, [1, 0, -1]) ||
                                        (0, a.Diag)(_t48, _n27, _s32, [0, 1, 1]) ||
                                        (0, a.Diag)(_t48, _n27, _s32, [0, 1, -1])) &&
                                        ((_f4 = !0), (BLOCKS[_t48][_n27][_s32].isEmpty = !0)));
                    _M4++;
                }
                var _g4 = new Array();
                var _iterator14 = _createForOfIteratorHelper(BLOCKS);
                var _step14;
                try {
                    for (_iterator14.s(); !(_step14 = _iterator14.n()).done; ) {
                        var _t53 = _step14.value;
                        var _iterator18 = _createForOfIteratorHelper(_t53);
                        var _step18;
                        try {
                            for (_iterator18.s(); !(_step18 = _iterator18.n()).done; ) {
                                var _n31 = _step18.value;
                                _n31[0].isEmpty || (_g4.push(_n31[0]), (_n31[0].visited = !0));
                            }
                        } catch (err) {
                            _iterator18.e(err);
                        } finally {
                            _iterator18.f();
                        }
                    }
                } catch (err) {
                    _iterator14.e(err);
                } finally {
                    _iterator14.f();
                }
                for (_M4 = 0; _g4.length > 0 && _M4 < 1000; ) {
                    var _t51 = new Array();
                    var _iterator15 = _createForOfIteratorHelper(_g4);
                    var _step15;
                    try {
                        for (_iterator15.s(); !(_step15 = _iterator15.n()).done; ) {
                            var _n29 = _step15.value;
                            var _s33 = _n29.GetNeigh();
                            var _iterator16 = _createForOfIteratorHelper(_s33);
                            var _step16;
                            try {
                                for (_iterator16.s(); !(_step16 = _iterator16.n()).done; ) {
                                    var _n30 = _step16.value;
                                    _t51.push(_n30);
                                }
                            } catch (err) {
                                _iterator16.e(err);
                            } finally {
                                _iterator16.f();
                            }
                        }
                    } catch (err) {
                        _iterator15.e(err);
                    } finally {
                        _iterator15.f();
                    }
                    _g4 = _t51;
                    _M4++;
                }
                var _iterator17 = _createForOfIteratorHelper(BLOCKS);
                var _step17;
                try {
                    for (_iterator17.s(); !(_step17 = _iterator17.n()).done; ) {
                        var _t54 = _step17.value;
                        var _iterator19 = _createForOfIteratorHelper(_t54);
                        var _step19;
                        try {
                            for (_iterator19.s(); !(_step19 = _iterator19.n()).done; ) {
                                var _n32 = _step19.value;
                                var _iterator20 = _createForOfIteratorHelper(_n32);
                                var _step20;
                                try {
                                    for (_iterator20.s(); !(_step20 = _iterator20.n()).done; ) {
                                        var _t55 = _step20.value;
                                        _t55.visited || (_t55.isEmpty = !0);
                                    }
                                } catch (err) {
                                    _iterator20.e(err);
                                } finally {
                                    _iterator20.f();
                                }
                            }
                        } catch (err) {
                            _iterator19.e(err);
                        } finally {
                            _iterator19.f();
                        }
                    }
                } catch (err) {
                    _iterator17.e(err);
                } finally {
                    _iterator17.f();
                }
                landscape.CalculateLight();
                for (var _t52 = 0; _t52 < BLOCKS.length; _t52++)
                    for (var _s34 = 0; _s34 < BLOCKS[_t52].length; _s34++)
                        for (var _i26 = 0; _i26 < BLOCKS[_t52][_s34].length; _i26++)
                            if (BLOCKS[_t52][_s34][_i26].isEmpty) {
                                (0 != _i26 && (BLOCKS[_t52][_s34][_i26 - 1].isEmpty || BLOCKS[_t52][_s34][_i26 - 1].hasTerrain)) || (BLOCKS[_t52][_s34][_i26].roof = !0);
                            } else {
                                if (_t52 > 0 && (0, n.Continous)(BLOCKS[_t52 - 1][_s34][_i26], BLOCKS[_t52][_s34][_i26])) {
                                    BLOCKS[_t52][_s34][_i26].contX = !0;
                                }
                                if (_s34 > 0 && (0, n.Continous)(BLOCKS[_t52][_s34 - 1][_i26], BLOCKS[_t52][_s34][_i26])) {
                                    BLOCKS[_t52][_s34][_i26].contY = !0;
                                }
                                if (0 == _t52 || (_t52 > 0 && BLOCKS[_t52 - 1][_s34][_i26].isEmpty)) {
                                    BLOCKS[_t52][_s34][_i26].winX = !0;
                                }
                                if (0 == _s34 || (_s34 > 0 && BLOCKS[_t52][_s34 - 1][_i26].isEmpty)) {
                                    BLOCKS[_t52][_s34][_i26].winY = !0;
                                }
                                if (_i26 < BLOCKS[_t52][_s34].length - 1 && (0, n.Continous)(BLOCKS[_t52][_s34][_i26], BLOCKS[_t52][_s34][_i26 + 1])) {
                                    BLOCKS[_t52][_s34][_i26].contZ = !0;
                                }
                            }
                (0, e.SetUpEffects)();
                p = !0;
                break;
            } catch (t) {
                p = !1;
                console.log('problem. repeating.');
            }
        var g = 0;
        var m = 4;
        var C = self.innerWidth;
        var x = self.innerHeight;
        try {
            var _t56 = new URLSearchParams(window.location.search);
            var _n33 = _t56.get('h');
            var _s35 = _t56.get('w');
            if (_n33) {
                x = parseInt(_n33);
                console.log('set H to ' + x);
            }
            if (_s35) {
                C = parseInt(_s35);
                console.log('set W to ' + C);
            }
        } catch (_unused8) {
            C = self.innerWidth;
            x = self.innerHeight;
        }
        var y = document.createElement('canvas');
        y.id = 'sumCanvas';
        y.style.maxWidth = '100%';
        y.style.maxHeight = '100%';
        y.style.zIndex = 999;
        s.g.birdCtx = y.getContext('2d');
        document.body.prepend(y);
        s.g.mainCanvas = document.createElement('canvas');
        mainCanvas.id = 'mainCanvas';
        mainCanvas.style.display = 'none';
        s.g.mainCtx = mainCanvas.getContext('2d', { willReadFrequently: !0 });
        document.body.prepend(mainCanvas);
        (function (t, n) {
            var i = Math.min(18 * Math.ceil(t / 18), 18 * Math.ceil(n / 32));
            i = 18 * Math.ceil(Math.max(90, i, Math.min(900, 3 * i)) / 18);
            var e = Math.round((16 * i) / 9);
            console.log('best size for w=' + t + ', h=' + n + ' is ' + i + 'x' + e);
            mainCanvas.width = Math.round(i);
            mainCanvas.height = Math.round(e);
            y.width = mainCanvas.width;
            y.height = mainCanvas.height;
            g = 0;
            m = 4 * Math.min(20, Math.round(Math.max(1, 3200 / Math.max(1, mainCanvas.height))));
            s.g.DMAP = new r.Array2D(Math.min(mainCanvas.width, 900), Math.min(mainCanvas.height, 1600), 0);
        })(C, x);
        setInterval(function () {
            !(function () {
                var t = IMG / Math.max(1, mainCanvas.width);
                if (g < m) {
                    if (((0, o.renderLight)(g, 5000, t, mainCanvas.width, mainCanvas.height), 0 == g)) {
                        try {
                            for (var _n34 = 0; _n34 < 100; _n34++) (0, e.RenderBirds)(t, mainCanvas.width, mainCanvas.height);
                        } catch (_unused9) {}
                    }
                    if (3 == g) {
                        try {
                            (0, e.SetUpPeople)(t, mainCanvas.width, mainCanvas.height);
                        } catch (_unused10) {}
                    }
                }
                birdCtx.drawImage(mainCanvas, 0, 0);
                try {
                    if ((g > 3 && (0, e.RenderBirds)(t, mainCanvas.width, mainCanvas.height), g < m)) {
                        birdCtx.fillStyle = (0, a.hashColor)([CUTCLR[0] + 0.5 * (255 - CUTCLR[0]), CUTCLR[1] + 0.5 * (255 - CUTCLR[1]), CUTCLR[2] + 0.5 * (255 - CUTCLR[2]), 1]);
                        birdCtx.beginPath();
                        birdCtx.arc(mainCanvas.width / 2, mainCanvas.height / 2, mainCanvas.width / 16, 0, 2 * Math.PI);
                        birdCtx.fill();
                        birdCtx.fillStyle = (0, a.hashColor)([TERCLR[0], TERCLR[1], TERCLR[2], 0.9]);
                        var _t57 = Math.round((100 * (g + 1)) / m) + '%';
                        birdCtx.font = 0.031 * mainCanvas.width + 'px monospace';
                        birdCtx.textAlign = 'center';
                        birdCtx.textBaseline = 'ideographic';
                        birdCtx.fillText(_t57, 0.499 * mainCanvas.width, 0.015 * mainCanvas.width + mainCanvas.height / 2);
                    }
                } catch (_unused11) {}
                g++;
                if (g > 10000) {
                    g = 10000;
                }
            })();
        }, 80);
    })();
})();
