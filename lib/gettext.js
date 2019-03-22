/**
 * application: gettext
 * 
 * powered by ! gettext.js - Guillaume Potier - MIT Licensed - version 0.7
 * 
 * updated by Moreira in 2019-03-21
 */
'use strict';

(function (root, undef) {
  
  const 
  
  _plural_funcs = {},
  _dictionary = {},
  _plural_forms = {},
  
  
  defaults = {
    domain: 'messages',
    locale: (typeof document !== 'undefined' && document.documentElement.getAttribute('lang')) || 'en',
    plural_func: n => ({ nplurals: 2, plural: (n!=1) ? 1 : 0 }),
    ctxt_delimiter: String.fromCharCode(4) // \u0004
  },

  
  // sprintf equivalent, takes a string and some arguments to make a computed string
  // eg: strfmt("%1 dogs are in %2", 7, "the kitchen"); => "7 dogs are in the kitchen"
  // eg: strfmt("I like %1, bananas and %1", "apples"); => "I like apples, bananas and apples"
  strfmt = (...args) => {
    return args[0]
      // put space after double % to prevent placeholder replacement of such matches
      .replace(/%%/g, '%% ')
      // replace placeholders
      .replace(/%(\d+)/g, (str, p1) => args[p1])
      // replace double % and space with single %
      .replace(/%% /g, '%');
  },
      

  // handy mixins taken from underscode.js
  isObject = obj => {
    const type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  },

  
  expand_locale = locale => {
    const locales = [locale];
    let i = locale.lastIndexOf('-');
    while (i > 0) {
      locale = locale.slice(0, i);
      locales.push(locale);
      i = locale.lastIndexOf('-');
    }
    return locales;
  },
  
  
  getPluralFunc = plural_form => {
    
    // Plural form string regexp
    // taken from https://github.com/Orange-OpenSource/gettext.js/blob/master/lib.gettext.js
    // plural forms list available here http://localization-guide.readthedocs.org/en/latest/l10n/pluralforms.html
    const pf_re = new RegExp('^\\s*nplurals\\s*=\\s*[0-9]+\\s*;\\s*plural\\s*=\\s*(?:\\s|[-\\?\\|&=!<>+*/%:;n0-9_\(\)])+');
    if (!pf_re.test(plural_form)) throw new Error(strfmt('The plural form "%1" is not valid', plural_form));
    
    // Careful here, this is a hidden eval() equivalent..
    // Risk should be reasonable though since we test the plural_form through regex before
    // taken from https://github.com/Orange-OpenSource/gettext.js/blob/master/lib.gettext.js
    // TODO: should test if https://github.com/soney/jsep present and use it if so
    return new Function("n", `
      var plural, nplurals; 
      ${plural_form} return { 
        nplurals: nplurals, 
        plural: (plural === true ? 1 : (plural ? plural : 0)) 
      };`
    );
  },
  
  
  // Proper translation function that handle plurals and directives
  // Contains juicy parts of https://github.com/Orange-OpenSource/gettext.js/blob/master/lib.gettext.js
  t = function (_locale, messages, n, options, ...args) {
    
    // Singular is very easy, just pass dictionnary message through strfmt
    if (1 === messages.length)
      return strfmt(...[messages[0]].concat(args));
      
    let plural;
    
    // if a plural func is given, use that one
    if (options.plural_func) {
      plural = options.plural_func(n);
      
      // if plural form never interpreted before, do it now and store it
    } else if (!_plural_funcs[_locale]) {

      _plural_funcs[_locale] = getPluralFunc(_plural_forms[_locale]);
      plural = _plural_funcs[_locale](n);

    // we have the plural function, compute the plural result
    } else {
      plural = _plural_funcs[_locale](n);
    }
    
    // If there is a problem with plurals, fallback to singular one
    if ('undefined' === typeof plural.plural || plural.plural > plural.nplurals || messages.length <= plural.plural) 
      plural.plural = 0;

    return strfmt(...[messages[plural.plural], n].concat(args));
  },
  
  
  setMessages = function (domain, locale, messages, plural_forms) {
    if (!domain || !locale || !messages)
      throw new Error('You must provide a domain, a locale and messages');
      
    if ('string' !== typeof domain || 'string' !== typeof locale || !isObject(messages))
      throw new Error('Invalid arguments');
      
    if (plural_forms) _plural_forms[locale] = plural_forms;
    if (!_dictionary[domain]) _dictionary[domain] = {};
    _dictionary[domain][locale] = messages;

    return this;
  },
  
  
  loadJSON = function (jsonData, domain) {
    if (!isObject(jsonData))
      jsonData = JSON.parse(jsonData);

    if (!jsonData[''] || !jsonData['']['language'] || !jsonData['']['plural-forms'])
      throw new Error('Wrong JSON, it must have an empty key ("") with "language" and "plural-forms" information');

    const headers = jsonData[''];
    delete jsonData[''];

    return setMessages.call(this, domain || defaults.domain, headers['language'], jsonData, headers['plural-forms']);
  },


  i18n = function (options = {}) {
    // this.__version = '0.5.3';

    // default values that could be overriden in i18n() construct
    let 
      _locale = options.locale || defaults.locale,
      _domain = options.domain || defaults.domain,
      _ctxt_delimiter = options.ctxt_delimiter || defaults.ctxt_delimiter;

    if (options.messages) {
      _dictionary[_domain] = {};
      _dictionary[_domain][_locale] = options.messages;
    }

    if (options.plural_forms) {
      _plural_forms[_locale] = options.plural_forms;
    }

    return {
      strfmt: strfmt, // expose strfmt util
      expand_locale: expand_locale, // expose expand_locale util

      // Declare shortcuts
      __: function (...args) { return this.gettext(...args) },
      _n: function (...args) { return this.ngettext(...args) },
      _p: function (...args) { return this.pgettext(...args) },

      setMessages: setMessages,
      loadJSON: loadJSON,
      setLocale: function (locale) {
        _locale = locale;
        return this;
      },
      getLocale: function () {
        return _locale;
      },
      // getter/setter for domain
      textdomain: function (domain) {
        if (!domain) return _domain;
        _domain = domain;
        return this;
      },
      gettext: function (msgid, ...args) {
        return this.dcnpgettext(...[undef, undef, msgid, undef, undef].concat(args));
      },
      ngettext: function (msgid, msgid_plural, n, ...args) {
        return this.dcnpgettext(...[undef, undef, msgid, msgid_plural, n].concat(args));
      },
      pgettext: function (msgctxt, msgid, ...args) {
        return this.dcnpgettext.apply(this, [undef, msgctxt, msgid, undef, undef].concat(args));
      },
      dcnpgettext: function (domain, msgctxt, msgid, msgid_plural, n, ...args) {
        
        if (domain == undef) domain = _domain;

        if ('string' !== typeof msgid)
          throw new Error(this.strfmt('Msgid "%1" is not a valid translatable string', msgid));

        let
          translation,
          options = {},
          key = msgctxt ? `${msgctxt}${_ctxt_delimiter}${msgid}` : msgid,
          exist,
          locale,
          locales = expand_locale(_locale);
        
        for (var i in locales) {
          locale = locales[i];
          exist = _dictionary[domain] && _dictionary[domain][locale] && _dictionary[domain][locale][key];

          // because it's not possible to define both a singular and a plural form of the same msgid,
          // we need to check that the stored form is the same as the expected one.
          // if not, we'll just ignore the translation and consider it as not translated.
          if (msgid_plural) {
            exist = exist && "string" !== typeof _dictionary[domain][locale][key];
          } else {
            exist = exist && "string" === typeof _dictionary[domain][locale][key];
          }
            
          if (exist) break;
        }

        if (!exist) {
          translation = msgid;
          options.plural_func = defaults.plural_func;
        } else {
          translation = _dictionary[domain][locale][key];
        }

        return msgid_plural ?
          
          // Plural one
          t(...[_locale, exist ? translation : [msgid, msgid_plural], n, options].concat(args)) :
          
          // Singular form
          t(...[_locale, [translation], n, options].concat(args));

      }
    };
  };

  // Handle node, commonjs
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports)
      exports = module.exports = i18n;
    exports.i18n = i18n;

  // Handle AMD
  } else if (typeof define === 'function' && define.amd) {
    define(function() { return i18n; });

  // Standard window browser
  } else {
    root['i18n'] = i18n;
  }
  
})(this);