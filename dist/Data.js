'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _import = require('lodash');

var _import2 = _interopRequireWildcard(_import);

var _debug = require('debug');

var _debug2 = _interopRequireWildcard(_debug);

var _VirtualType = require('./types/Virtual');

var _VirtualType2 = _interopRequireWildcard(_VirtualType);

var _Schema = require('./schemas/Schema');

var _Schema2 = _interopRequireWildcard(_Schema);

var log = _debug2['default']('orientose:data');

var Data = (function () {
	function Data(schema, properties, className, mainData) {
		var _this = this;

		_classCallCheck(this, Data);

		properties = properties || {};
		mainData = mainData || this;

		this._schema = schema;
		this._data = {};
		this._className = className;
		this._mainData = mainData;

		schema.traverse(function (propName, prop) {
			_this._data[propName] = new prop.schemaType(_this, prop, propName, mainData);
		});

		this.set(properties);
	}

	_createClass(Data, [{
		key: 'forEach',
		value: function forEach(returnType, fn) {
			var _this2 = this;

			if (typeof returnType === 'function') {
				fn = returnType;
				returnType = false;
			}

			Object.keys(this._data).forEach(function (key) {
				var value = returnType ? _this2._data[key] : _this2.get(key);
				fn(value, key);
			});
		}
	}, {
		key: 'toJSON',
		value: function toJSON(options) {
			var _this3 = this;

			var json = {};

			options = options || {};

			Object.keys(this._data).forEach(function (propName) {
				var prop = _this3._data[propName];

				if (prop.isRecordID && options.recordID) {
					var value = prop.toJSON(options);
					if (typeof value === 'undefined') {
						return;
					}

					if (typeof options.recordID === 'string') {
						propName = options.recordID;
					}

					json[propName] = value;
					return;
				}

				if (prop instanceof _VirtualType2['default'] && !options.virtuals) {
					return;
				}

				if (prop.isMetadata && !options.metadata) {
					return;
				}

				if (options.modified && !prop.isModified && !prop.hasDefault) {
					return;
				}

				if (typeof options.exclude === 'function' && options.exclude(prop.name, prop.options)) {
					return;
				}

				var value = prop.toJSON(options);
				if (typeof value === 'undefined') {
					return;
				}

				json[propName] = value;
			});

			return json;
		}
	}, {
		key: 'toObject',
		value: function toObject(options) {
			var _this4 = this;

			var json = {};

			options = options || {};

			Object.keys(this._data).forEach(function (propName) {
				var prop = _this4._data[propName];

				if (prop instanceof _VirtualType2['default'] && !options.virtuals) {
					return;
				}

				if (prop.isMetadata && !options.metadata) {
					return;
				}

				if (options.modified && !prop.isModified && !prop.hasDefault) {
					return;
				}

				var value = prop.toObject(options);
				if (typeof value === 'undefined') {
					return;
				}

				json[propName] = value;
			});

			return json;
		}
	}, {
		key: 'isModified',
		value: function isModified(path) {
			var pos = path.indexOf('.');
			if (pos === -1) {
				if (!this._data[path]) {
					log('isModified Path not exists:' + path);
					return;
				}

				return this._data[path].isModified;
			}

			var currentKey = path.substr(0, pos);
			var newPath = path.substr(pos + 1);

			if (!this._data[currentKey]) {
				log('isModified deep Path not exists:' + currentKey);
				return;
			}

			var data = this._data[currentKey].value;
			if (!data || !data.get) {
				return;
				throw new Error('Subdocument is not defined or it is not an object');
			}

			return data.get(newPath);
		}
	}, {
		key: 'get',
		value: function get(path) {
			var pos = path.indexOf('.');
			if (pos === -1) {
				if (!this._data[path]) {
					log('get Path not exists:' + path);
					return;
				}

				return this._data[path].value;
			}

			var currentKey = path.substr(0, pos);
			var newPath = path.substr(pos + 1);

			if (!this._data[currentKey]) {
				log('get deep Path not exists:' + currentKey, path, newPath);
				return;
			}

			var data = this._data[currentKey].value;
			if (!data || !data.get) {
				return;
				throw new Error('Subdocument is not defined or it is not an object');
			}

			return data.get(newPath);
		}
	}, {
		key: 'set',
		value: function set(path, value, setAsOriginal) {
			var _this5 = this;

			if (_import2['default'].isPlainObject(path)) {
				Object.keys(path).forEach(function (key) {
					_this5.set(key, path[key], setAsOriginal);
				});
				return this;
			}

			var pos = path.indexOf('.');
			if (pos === -1) {
				var property = this._data[path];
				if (!property) {
					log('set Path not exists:' + path);
					return this;
				}

				property.value = value;

				if (setAsOriginal) {
					property.setAsOriginal();
				}
				return this;
			}

			var currentKey = path.substr(0, pos);
			var newPath = path.substr(pos + 1);

			if (!this._data[currentKey]) {
				log('set deep Path not exists:' + currentKey);
				return;
			}

			var data = this._data[currentKey].value;
			if (!data || !data.set) {
				return this;
				throw new Error('Subdocument is not defined or it is not an object');
			}

			data.set(newPath, value, setAsOriginal);
			return this;
		}
	}, {
		key: 'setupData',
		value: function setupData(properties) {
			this.set(properties, null, true);
		}
	}], [{
		key: 'createClass',
		value: function createClass(schema) {
			var DataClass = (function (_Data) {
				function DataClass(properties, className, mainData) {
					_classCallCheck(this, DataClass);

					_get(Object.getPrototypeOf(DataClass.prototype), 'constructor', this).call(this, schema, properties, className, mainData);
				}

				_inherits(DataClass, _Data);

				return DataClass;
			})(Data);

			;

			//define properties
			schema.traverse(function (fieldName) {
				Object.defineProperty(DataClass.prototype, fieldName, {
					enumerable: true,
					configurable: true,
					get: function get() {
						return this.get(fieldName);
					},
					set: function set(value) {
						return this.set(fieldName, value);
					}
				});
			});

			return DataClass;
		}
	}]);

	return Data;
})();

exports['default'] = Data;
module.exports = exports['default'];