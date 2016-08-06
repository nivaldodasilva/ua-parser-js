/**
 * UAParser.js v0.7.10
 * Lightweight JavaScript-based User-Agent string parser
 * https://github.com/faisalman/ua-parser-js
 *
 * Copyright © 2012-2015 Faisal Salman <fyzlman@gmail.com>
 * Dual licensed under GPLv2 & MIT
 */

//////////////
// Constants
/////////////

var LIBVERSION = '0.7.10',
    EMPTY = '',
    UNKNOWN = '?',
    FUNC_TYPE = 'function',
    UNDEF_TYPE = 'undefined',
    OBJ_TYPE = 'object',
    STR_TYPE = 'string',
    MODEL = 'model',
    NAME = 'name',
    TYPE = 'type',
    VENDOR = 'vendor',
    VERSION = 'version',
    ARCHITECTURE = 'architecture',
    CONSOLE = 'console',
    MOBILE = 'mobile',
    DESKTOP = 'desktop',
    TABLET = 'tablet',
    SMARTTV = 'smarttv',
    WEARABLE = 'wearable',
    EMBEDDED = 'embedded';


///////////
// Helper
//////////

var util = {
    extend: function (regexes, extensions) {
        for (var i in extensions) {
            if ("browser os".indexOf(i) !== -1 && extensions[i].length % 2 === 0) {
                regexes[i] = extensions[i].concat(regexes[i]);
            }
        }
        return regexes;
    },
    has: function (str1, str2) {
        if (typeof str1 === "string") {
            return str2.toLowerCase().indexOf(str1.toLowerCase()) !== -1;
        } else {
            return false;
        }
    },
    lowerize: function (str) {
        return str.toLowerCase();
    }
};

///////////////
// Map helper
//////////////

var mapper = {

    rgx: function () {

        var result, i = 0, j, k, p, q, matches, match, args = arguments;

        // loop through all regexes maps
        while (i < args.length && !matches) {

            var regex = args[i],       // even sequence (0,2,4,..)
                props = args[i + 1];   // odd sequence (1,3,5,..)

            // construct object barebones
            if (typeof result === UNDEF_TYPE) {
                result = {};
                for (p in props) {
                    if (props.hasOwnProperty(p)) {
                        q = props[p];
                        if (typeof q === OBJ_TYPE) {
                            result[q[0]] = undefined;
                        } else {
                            result[q] = undefined;
                        }
                    }
                }
            }

            // try matching uastring with regexes
            j = k = 0;
            while (j < regex.length && !matches) {
                matches = regex[j++].exec(this.getUA());
                if (!!matches) {
                    for (p = 0; p < props.length; p++) {
                        match = matches[++k];
                        q = props[p];
                        // check if given property is actually array
                        if (typeof q === OBJ_TYPE && q.length > 0) {
                            if (q.length == 2) {
                                if (typeof q[1] == FUNC_TYPE) {
                                    // assign modified match
                                    result[q[0]] = q[1].call(this, match);
                                } else {
                                    // assign given value, ignore regex match
                                    result[q[0]] = q[1];
                                }
                            } else if (q.length == 3) {
                                // check whether function or regex
                                if (typeof q[1] === FUNC_TYPE && !(q[1].exec && q[1].test)) {
                                    // call function (usually string mapper)
                                    result[q[0]] = match ? q[1].call(this, match, q[2]) : undefined;
                                } else {
                                    // sanitize match using given regex
                                    result[q[0]] = match ? match.replace(q[1], q[2]) : undefined;
                                }
                            } else if (q.length == 4) {
                                result[q[0]] = match ? q[3].call(this, match.replace(q[1], q[2])) : undefined;
                            }
                        } else {
                            result[q] = match ? match : undefined;
                        }
                    }
                }
            }
            i += 2;
        }
        return result;
    },

    str: function (str, map) {

        for (var i in map) {
            // check if array
            if (typeof map[i] === OBJ_TYPE && map[i].length > 0) {
                for (var j = 0; j < map[i].length; j++) {
                    if (util.has(map[i][j], str)) {
                        return (i === UNKNOWN) ? undefined : i;
                    }
                }
            } else if (util.has(map[i], str)) {
                return (i === UNKNOWN) ? undefined : i;
            }
        }
        return str;
    }
};

///////////////
// String map
//////////////

var maps = {

    browser: {
        oldsafari: {
            version: {
                '1.0': '/8',
                '1.2': '/1',
                '1.3': '/3',
                '2.0': '/412',
                '2.0.2': '/416',
                '2.0.3': '/417',
                '2.0.4': '/419',
                '?': '/'
            }
        }
    },

    os: {
        windows: {
            version: {
                'ME': '4.90',
                'NT 3.11': 'NT3.51',
                'NT 4.0': 'NT4.0',
                '2000': 'NT 5.0',
                'XP': ['NT 5.1', 'NT 5.2'],
                'Vista': 'NT 6.0',
                '7': 'NT 6.1',
                '8': 'NT 6.2',
                '8.1': 'NT 6.3',
                '10': ['NT 6.4', 'NT 10.0'],
                'RT': 'ARM'
            }
        }
    }
};

//////////////
// Regex map
/////////////

var regexes = {

    browser: [[

        // Presto based
        /(opera\smini)\/([\w\.-]+)/i,                                       // Opera Mini
        /(opera\s[mobiletab]+).+version\/([\w\.-]+)/i,                      // Opera Mobi/Tablet
        /(opera).+version\/([\w\.]+)/i,                                     // Opera > 9.80
        /(opera)[\/\s]+([\w\.]+)/i                                          // Opera < 9.80

    ], [NAME, VERSION], [

            /\s(opr)\/([\w\.]+)/i                                               // Opera Webkit
        ], [[NAME, 'Opera'], VERSION], [

            // Mixed
            /(kindle)\/([\w\.]+)/i,                                             // Kindle
            /(lunascape|maxthon|netfront|jasmine|blazer)[\/\s]?([\w\.]+)*/i,
            // Lunascape/Maxthon/Netfront/Jasmine/Blazer

            // Trident based
            /(avant\s|iemobile|slim|baidu)(?:browser)?[\/\s]?([\w\.]*)/i,
            // Avant/IEMobile/SlimBrowser/Baidu
            /(?:ms|\()(ie)\s([\w\.]+)/i,                                        // Internet Explorer

            // Webkit/KHTML based
            /(rekonq)\/([\w\.]+)*/i,                                            // Rekonq
            /(chromium|flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs)\/([\w\.-]+)/i
            // Chromium/Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt/Iron/Iridium/PhantomJS
        ], [NAME, VERSION], [

            /(trident).+rv[:\s]([\w\.]+).+like\sgecko/i                         // IE11
        ], [[NAME, 'IE'], VERSION], [

            /(edge)\/((\d+)?[\w\.]+)/i                                          // Microsoft Edge
        ], [NAME, VERSION], [

            /(yabrowser)\/([\w\.]+)/i                                           // Yandex
        ], [[NAME, 'Yandex'], VERSION], [

            /(comodo_dragon)\/([\w\.]+)/i                                       // Comodo Dragon
        ], [[NAME, /_/g, ' '], VERSION], [

            /(chrome|omniweb|arora|[tizenoka]{5}\s?browser)\/v?([\w\.]+)/i,
            // Chrome/OmniWeb/Arora/Tizen/Nokia
            /(qqbrowser)[\/\s]?([\w\.]+)/i
            // QQBrowser
        ], [NAME, VERSION], [

            /(uc\s?browser)[\/\s]?([\w\.]+)/i,
            /ucweb.+(ucbrowser)[\/\s]?([\w\.]+)/i,
            /JUC.+(ucweb)[\/\s]?([\w\.]+)/i
            // UCBrowser
        ], [[NAME, 'UCBrowser'], VERSION], [

            /(dolfin)\/([\w\.]+)/i                                              // Dolphin
        ], [[NAME, 'Dolphin'], VERSION], [

            /((?:android.+)crmo|crios)\/([\w\.]+)/i                             // Chrome for Android/iOS
        ], [[NAME, 'Chrome'], VERSION], [

            /XiaoMi\/MiuiBrowser\/([\w\.]+)/i                                   // MIUI Browser
        ], [VERSION, [NAME, 'MIUI Browser']], [

            /android.+version\/([\w\.]+)\s+(?:mobile\s?safari|safari)/i         // Android Browser
        ], [VERSION, [NAME, 'Android Browser']], [

            /FBAV\/([\w\.]+);/i                                                 // Facebook App for iOS
        ], [VERSION, [NAME, 'Facebook']], [

            /fxios\/([\w\.-]+)/i                                                // Firefox for iOS
        ], [VERSION, [NAME, 'Firefox']], [

            /version\/([\w\.]+).+?mobile\/\w+\s(safari)/i                       // Mobile Safari
        ], [VERSION, [NAME, 'Mobile Safari']], [

            /version\/([\w\.]+).+?(mobile\s?safari|safari)/i                    // Safari & Safari Mobile
        ], [VERSION, NAME], [

            /webkit.+?(mobile\s?safari|safari)(\/[\w\.]+)/i                     // Safari < 3.0
        ], [NAME, [VERSION, mapper.str, maps.browser.oldsafari.version]], [

            /(konqueror)\/([\w\.]+)/i,                                          // Konqueror
            /(webkit|khtml)\/([\w\.]+)/i
        ], [NAME, VERSION], [

            // Gecko based
            /(navigator|netscape)\/([\w\.-]+)/i                                 // Netscape
        ], [[NAME, 'Netscape'], VERSION], [
            /(swiftfox)/i,                                                      // Swiftfox
            /(icedragon|iceweasel|camino|chimera|fennec|maemo\sbrowser|minimo|conkeror)[\/\s]?([\w\.\+]+)/i,
            // IceDragon/Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror
            /(firefox|seamonkey|k-meleon|icecat|iceape|firebird|phoenix)\/([\w\.-]+)/i,
            // Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
            /(mozilla)\/([\w\.]+).+rv\:.+gecko\/\d+/i,                          // Mozilla

            // Other
            /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir)[\/\s]?([\w\.]+)/i,
            // Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf/Sleipnir
            /(links)\s\(([\w\.]+)/i,                                            // Links
            /(gobrowser)\/?([\w\.]+)*/i,                                        // GoBrowser
            /(ice\s?browser)\/v?([\w\._]+)/i,                                   // ICE Browser
            /(mosaic)[\/\s]([\w\.]+)/i                                          // Mosaic
        ], [NAME, VERSION], [

            //Not Find
            /()\s?([\w\.]+)*/i
        ], [[NAME, 'Other'], [VERSION, '0']]

    ],

    os: [[

        /(windows)\snt\s6\.2;\s(arm)/i,                                     // Windows Mobile
        /(windows\sphone(?:\sos)*|windows\smobile)[\s\/]?([ce\d\.\s]+\w)/i
    ], [NAME, [VERSION, mapper.str, maps.os.windows.version], [TYPE, MOBILE]], [

            /(xbox)\w*\/?([\w\.]+)*/i                                           // Xbox
        ], [[NAME, 'Xbox'], VERSION, [TYPE, CONSOLE]], [

            // Windows based
            /microsoft\s(windows)\s(vista|xp)/i                                 // Windows (iTunes)
        ], [NAME, VERSION, [TYPE, DESKTOP]], [

            /(win(?=3|9|n)|win\s9x\s)([nt\d\.]+)/i
        ], [[NAME, 'Windows'], [VERSION, mapper.str, maps.os.windows.version], [TYPE, DESKTOP]], [

            /(windows)[\s\/]?([nt\d\.\s]+\w)/i                                  // Windows RT
        ], [NAME, [VERSION, mapper.str, maps.os.windows.version], [TYPE, DESKTOP]], [


            // Mobile/Embedded OS
            /\((bb)(10);/i                                                      // BlackBerry 10
        ], [[NAME, 'BlackBerry'], VERSION, [TYPE, MOBILE]], [

            /(blackberry)\w*\/?([\w\.]+)*/i,                                    // Blackberry
            /(tizen)[\/\s]([\w\.]+)/i,                                          // Tizen
            /(android|webos|palm\sos|qnx|bada|rim\stablet\sos|meego|contiki)[\/\s-]?([\w\.]+)*/i,
            // Android/WebOS/Palm/QNX/Bada/RIM/MeeGo/Contiki
            /linux;.+(sailfish);/i                                              // Sailfish OS
        ], [NAME, VERSION, [TYPE, MOBILE]], [

            /(symbian\s?os|symbos|s60(?=;))[\/\s-]?([\w\.]+)*/i                 // Symbian
        ], [[NAME, 'Symbian'], VERSION, [TYPE, MOBILE]], [

            /\((series40);/i                                                    // Series 40
        ], [NAME, [TYPE, MOBILE]], [

            /mozilla.+\(mobile;.+gecko.+firefox/i                               // Firefox OS
        ], [[NAME, 'Firefox OS'], VERSION, [TYPE, MOBILE]], [

            // Console
            /(nintendo|playstation)\s([wids34portablevu]+)/i
        ], [NAME, [VERSION, ''], [TYPE, CONSOLE]], [                        // Nintendo/Playstation

            // GNU/Linux based
            /(mint)[\/\s\(]?(\w+)*/i,                                           // Mint
            /(mageia|vectorlinux)[;\s]/i,                                       // Mageia/VectorLinux
            /(joli|[kxln]?ubuntu|debian|[open]*suse|gentoo|(?=\s)arch|slackware|fedora|mandriva|centos|pclinuxos|redhat|zenwalk|linpus)[\/\s-]?([\w\.-]+)*/i,
            // Joli/Ubuntu/Debian/SUSE/Gentoo/Arch/Slackware
            // Fedora/Mandriva/CentOS/PCLinuxOS/RedHat/Zenwalk/Linpus
            /(hurd|linux)\s?([\w\.]+)*/i,                                       // Hurd/Linux
            /(gnu)\s?([\w\.]+)*/i                                               // GNU
        ], [NAME, VERSION, [TYPE, DESKTOP]], [

            /(cros)\s[\w]+\s([\w\.]+\w)/i                                       // Chromium OS
        ], [[NAME, 'Chromium OS'], VERSION, [TYPE, DESKTOP]], [

            // Solaris
            /(sunos)\s?([\w\.]+\d)*/i                                           // Solaris
        ], [[NAME, 'Solaris'], VERSION, [TYPE, DESKTOP]], [

            // BSD based
            /\s([frentopc-]{0,4}bsd|dragonfly)\s?([\w\.]+)*/i                   // FreeBSD/NetBSD/OpenBSD/PC-BSD/DragonFly
        ], [NAME, VERSION, [TYPE, DESKTOP]], [

            /(ip[honead]+)(?:.*os\s([\w]+)*\slike\smac|;\sopera)/i              // iOS
        ], [[NAME, 'iOS'], [VERSION, /_/g, '.'], [TYPE, MOBILE]], [

            /(mac\sos\sx)\s?([\w\s\.]+\w)*/i,
            /(macintosh|mac(?=_powerpc)\s)/i                                    // Mac OS
        ], [[NAME, 'Mac OS'], [VERSION, /_/g, '.'], [TYPE, DESKTOP]], [

            // Other
            /((?:open)?solaris)[\/\s-]?([\w\.]+)*/i,                            // Solaris
            /(haiku)\s(\w+)/i,                                                  // Haiku
            /(aix)\s((\d)(?=\.|\)|\s)[\w\.]*)*/i,                               // AIX
            /(plan\s9|minix|beos|os\/2|amigaos|morphos|risc\sos|openvms)/i,
            // Plan9/Minix/BeOS/OS2/AmigaOS/MorphOS/RISCOS/OpenVMS
            /(unix)\s?([\w\.]+)*/i                                              // UNIX
        ], [NAME, VERSION, [TYPE, DESKTOP]], [

            //other
            /()\s?([\w\.]+)*/i
        ], [[NAME, 'Other'], [VERSION, '0'], [TYPE, DESKTOP]]
    ]
};

/////////////////
// Constructor
////////////////

var UAParser = function (uastring, extensions) {

    if (!(this instanceof UAParser)) {
        return new UAParser(uastring, extensions).getResult();
    }

    var ua = uastring || ((window && window.navigator && window.navigator.userAgent) ? window.navigator.userAgent : EMPTY);

    var rgxmap = extensions ? util.extend(regexes, extensions) : regexes;

    this.getBrowser = function () {
        var browser = mapper.rgx.apply(this, rgxmap.browser);
        return browser;
    };

    this.getOS = function () {
        var os = mapper.rgx.apply(this, rgxmap.os);
        return os;
    };

    this.getResult = function () {
        return {
            ua: this.getUA(),
            browser: this.getBrowser(),
            os: this.getOS()
        };
    };

    this.getUA = function () {
        return ua;
    };

    this.setUA = function (uastring) {
        ua = uastring;
        return this;
    };

    this.setUA(ua);

    return this;
};

UAParser.BROWSER = {
    NAME: NAME,
    VERSION: VERSION
};

UAParser.OS = {
    NAME: NAME,
    VERSION: VERSION
};


///////////
// Export
//////////

module.exports = UAParser;
