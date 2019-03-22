/**
 * application: myutils
 * 
 * powered by
 */
'use strict';

const 
  { expect } = require('chai'),
  i18n = require('../lib/gettext');

(function () {
  
    describe('gettext.js test suite', function () {
        describe('General API', function () {
            it('should be defined', function () {
                expect(i18n).to.be.a('function');
            });
            it('should be instanciable', function () {
                expect(i18n()).to.be.an('object');
            });
            it('should have default locale', function () {
                const _i18n = i18n();
                expect(_i18n.getLocale()).to.be.equal('en');
            });
            it('should allow to set locale', function () {
                const _i18n = i18n({
                    locale: 'fr'
                });
                expect(_i18n.getLocale()).to.be.equal('fr');
            });
            it('should allow to set messages', function () {
                const _i18n = i18n({
                    locale: 'fr',
                    messages: {
                        "apple": "pomme"
                    }
                });
                expect(_i18n.getLocale()).to.be.equal('fr');
                expect(_i18n.gettext('apple')).to.be.equal('pomme');
            });
        });
        describe('methods', function () {
            let _i18n;
            before(function () {
                _i18n = new i18n();
            });

            describe('strfmt', function () {
                it('should be a i18n method', function () {
                    expect(_i18n.strfmt).to.be.a('function');
                });
                it('should handle one replacement', function () {
                    expect(_i18n.strfmt('foo %1 baz', 'bar')).to.be.equal('foo bar baz');
                });
                it('should handle many replacements', function () {
                    expect(_i18n.strfmt('foo %1 baz %2', 'bar', 42)).to.be.equal('foo bar baz 42');
                });
                it('should handle order', function () {
                    expect(_i18n.strfmt('foo %2 baz %1', 'bar', 42)).to.be.equal('foo 42 baz bar');
                });
                it('should handle repeat', function () {
                    expect(_i18n.strfmt('foo %1 baz %1', 'bar', 42)).to.be.equal('foo bar baz bar');
                });
                it('should handle literal percent (%) signs', function () {
                    expect(_i18n.strfmt('foo 1%% bar')).to.be.equal('foo 1% bar');
                    expect(_i18n.strfmt('foo %1%% bar', 10)).to.be.equal('foo 10% bar');
                    expect(_i18n.strfmt('foo %%1 bar')).to.be.equal('foo %1 bar');
                    expect(_i18n.strfmt('foo %%%1 bar', 10)).to.be.equal('foo %10 bar');
                });
            });

            describe('expand_locale', function() {
                it('should be a i18n method', function() {
                    expect(_i18n.expand_locale).to.be.a('function');
                });
                it('should handle simple locale', function() {
                    expect(_i18n.expand_locale('fr')).to.eql(['fr']);
                });
                it('should handle complex locale', function() {
                    expect(_i18n.expand_locale('de-CH-1996')).to.eql(['de-CH-1996', 'de-CH', 'de']);
                });
            });

            describe('gettext', function () {
                it('should handle peacefully singular untranslated keys', function () {
                    expect(_i18n.gettext('not translated')).to.be.equal('not translated');
                });
                it('should handle peacefully singular untranslated keys with extra', function () {
                    expect(_i18n.gettext('not %1 translated', 'correctly')).to.be.equal('not correctly translated');
                    expect(_i18n.gettext('not %1 %2 translated', 'fully', 'correctly')).to.be.equal('not fully correctly translated');
                });
                it('should fallback to father language', function() {
                    _i18n = new i18n();

                    _i18n.setMessages('messages', 'fr', {
                        "Mop": "Serpillière",
                    });

                    _i18n.setMessages('messages', 'fr-BE', {
                        "Mop": "Torchon",
                    });

                    _i18n.setLocale('fr-BE');
                    expect(_i18n.gettext("Mop")).to.be.equal("Torchon");

                    _i18n.setLocale('fr');
                    expect(_i18n.gettext("Mop")).to.be.equal("Serpillière");

                    _i18n.setLocale('fr-FR');
                    expect(_i18n.gettext("Mop")).to.be.equal("Serpillière");
                });
            });

            describe('ngettext', function () {
                it('should handle peacefully plural untranslated keys', function () {
                    // english default plural rule is n !== 1
                    expect(_i18n.ngettext('%1 not translated singular', '%1 not translated plural', 0)).to.be.equal('0 not translated plural');
                    expect(_i18n.ngettext('%1 not translated singular', '%1 not translated plural', 1)).to.be.equal('1 not translated singular');
                    expect(_i18n.ngettext('%1 not translated singular', '%1 not translated plural', 3)).to.be.equal('3 not translated plural');
                });
                it('should handle peacefully plural untranslated keys with extra', function () {
                    expect(_i18n.ngettext('%1 not %2 singular', '%1 not %2 plural', 1, 'foo')).to.be.equal('1 not foo singular');
                    expect(_i18n.ngettext('%1 not %2 singular', '%1 not %2 plural', 3, 'foo')).to.be.equal('3 not foo plural');
                });
                it('should use default english plural form for untranslated keys', function () {
                    _i18n = new i18n({ locale: 'fr', plural_forms: 'nplurals=2; plural=n>1;' });
                    expect(_i18n.ngettext('%1 not translated singular', '%1 not translated plural', 0)).to.be.equal('0 not translated plural');
                    expect(_i18n.ngettext('%1 not translated singular', '%1 not translated plural', 1)).to.be.equal('1 not translated singular');
                    expect(_i18n.ngettext('%1 not translated singular', '%1 not translated plural', 3)).to.be.equal('3 not translated plural');
                });
                it('should handle correctly other language plural passed through setMessages method', function () {
                    _i18n = new i18n({locale: 'fr'});
                    _i18n.setMessages('messages', 'fr', {
                        "There is %1 apple": [
                            "Il y a %1 pomme",
                            "Il y a %1 pommes"
                        ]
                    }, 'nplurals=2; plural=n>1;');
                    expect(_i18n.ngettext('There is %1 apple', 'There are %1 apples', 0)).to.be.equal('Il y a 0 pomme');
                    expect(_i18n.ngettext('There is %1 apple', 'There are %1 apples', 1)).to.be.equal('Il y a 1 pomme');
                    expect(_i18n.ngettext('There is %1 apple', 'There are %1 apples', 2)).to.be.equal('Il y a 2 pommes');
                });
                it('should handle correctly other language plural passed through init options', function () {
                    _i18n = new i18n({
                        locale: 'fr',
                        messages: {
                            "There is %1 apple": [
                                "Il y a %1 pomme",
                                "Il y a %1 pommes"
                            ]
                        },
                        plural_forms: 'nplurals=2; plural=n>1;'
                    });
                    expect(_i18n.ngettext('There is %1 apple', 'There are %1 apples', 0)).to.be.equal('Il y a 0 pomme');
                    expect(_i18n.ngettext('There is %1 apple', 'There are %1 apples', 1)).to.be.equal('Il y a 1 pomme');
                    expect(_i18n.ngettext('There is %1 apple', 'There are %1 apples', 2)).to.be.equal('Il y a 2 pommes');
                });
                it('should ignore a plural translation when requesting the singular form', function () {
                    _i18n = new i18n({ locale: 'fr' });
                    _i18n.setMessages('messages', 'fr', {
                        "apple": [
                            "pomme",
                            "pommes"
                        ]
                    }, 'nplurals=2; plural=n>1;');
                    expect(_i18n.gettext('apple')).to.be.equal('apple');
                    expect(_i18n.ngettext('apple', 'apples', 1)).to.be.equal('pomme');
                    expect(_i18n.ngettext('apple', 'apples', 2)).to.be.equal('pommes');
                });
                it('should ignore a singular translation when requesting the plural form', function () {
                    _i18n = new i18n({ locale: 'fr' });
                    _i18n.setMessages('messages', 'fr', {
                        "apple": "pomme"
                    });
                    expect(_i18n.gettext('apple')).to.be.equal('pomme');
                    expect(_i18n.ngettext('apple', 'apples', 1)).to.be.equal('apple');
                    expect(_i18n.ngettext('apple', 'apples', 2)).to.be.equal('apples');
                });
                it('should fail unvalid plural form', function () {
                    _i18n = new i18n({ locale: 'foo' });
                    _i18n.setMessages('messages', 'foo', {
                        "There is %1 apple": [
                            "Il y a %1 pomme",
                            "Il y a %1 pommes"
                        ]
                    }, 'nplurals=2; plural=[not valid];');

                    // do not throw error on default plural form if key does not have a translation
                    expect(_i18n.ngettext('foo', 'bar', 2)).to.be.equal('bar');

                    try {
                        _i18n.ngettext('There is %1 apple', 'There are %1 apples', 42);
                    } catch (e) {
                        expect(e.message).to.be.equal('The plural form "nplurals=2; plural=[not valid];" is not valid');
                    }
                });
                it('should handle multiple locale & pluals cohabitation', function () {
                    _i18n = new i18n({ locale: 'foo' });
                    _i18n.setMessages('messages', 'foo', {
                        "singular": [
                            "singular",
                            "plural"
                        ]
                    }, 'nplurals=2; plural=n>10;');
                    _i18n.setMessages('messages', 'bar', {
                        "singular": [
                            "singulier",
                            "pluriel"
                        ]
                    }, 'nplurals=2; plural=n>100;');
                    expect(_i18n.ngettext('singular', 'plural', 9)).to.be.equal('singular');
                    expect(_i18n.ngettext('singular', 'plural', 11)).to.be.equal('plural');

                    _i18n.setLocale('bar');
                    expect(_i18n.ngettext('singular', 'plural', 9)).to.be.equal('singulier');
                    expect(_i18n.ngettext('singular', 'plural', 11)).to.be.equal('singulier');
                    expect(_i18n.ngettext('singular', 'plural', 111)).to.be.equal('pluriel');
                });
                it('should fallback to singular form if there is a problem with plurals', function () {
                    // incorrect plural, more than nplurals
                    _i18n = new i18n({ locale: 'foo' });
                    _i18n.setMessages('messages', 'foo', {
                        "apple": [
                            "pomme",
                            "pommes"
                        ]
                    }, 'nplurals=2; plural=3;');
                    expect(_i18n.ngettext('apple', 'apples', 1)).to.be.equal('pomme');

                    // plural is correct, but according to nplurals there should be more translations
                    _i18n = new i18n({ locale: 'ru' });
                    _i18n.setMessages('messages', 'ru', {
                        "%1 apple": [
                            "%1 яблоко",
                            "%1 яблока"
                            // "%1 яблок" - missed translation
                        ]
                    }, "nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);");
                    expect(_i18n.ngettext('%1 apple', '%1 apples', 5)).to.be.equal('5 яблоко');
                });
            });

            describe('loadJSON', function () {
                it('should properly load json', function () {
                    var parsedJSON = {
                        "": {
                            "language": "fr",
                            "plural-forms": "nplurals=2; plural=n>1;"
                        },
                        "Loading...": "Chargement...",
                        "Save": "Sauvegarder",
                        "There is %1 apple": [
                            "Il y a %1 pomme",
                            "Il y a %1 pommes"
                        ],
                        "Checkout\u0004Save": "Sauvegarder votre panier"
                    },
                    _i18n = i18n()
                        .loadJSON(JSON.stringify(parsedJSON))
                        .setLocale('fr');
                    expect(_i18n.getLocale(), 'fr');
                    expect(_i18n.textdomain(), 'messages');
                    expect(_i18n.gettext('Save')).to.be.equal('Sauvegarder');
                    expect(_i18n.gettext('Loading...')).to.be.equal('Chargement...');
                    expect(_i18n.ngettext('There is %1 apple', 'There are %1 apples', 0)).to.be.equal('Il y a 0 pomme');
                    expect(_i18n.ngettext('There is %1 apple', 'There are %1 apples', 2)).to.be.equal('Il y a 2 pommes');
                });
            });
        });
    });
}());