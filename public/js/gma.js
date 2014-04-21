(function () {

    /**
*
*  Base64 encode / decode
*  http://www.webtoolkit.info/
*
**/

    var Base64 = {

        // private property
        _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

        // public method for encoding
        encode: function (input) {
            var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i = 0;

            input = Base64._utf8_encode(input);

            while (i < input.length) {

                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output +
                this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

            }

            return output;
        },

        // public method for decoding
        decode: function (input) {
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i = 0;

            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

            while (i < input.length) {

                enc1 = this._keyStr.indexOf(input.charAt(i++));
                enc2 = this._keyStr.indexOf(input.charAt(i++));
                enc3 = this._keyStr.indexOf(input.charAt(i++));
                enc4 = this._keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }

            }

            output = Base64._utf8_decode(output);

            return output;

        },

        // private method for UTF-8 encoding
        _utf8_encode: function (string) {
            string = string.replace(/\r\n/g, "\n");
            var utftext = "";

            for (var n = 0; n < string.length; n++) {

                var c = string.charCodeAt(n);

                if (c < 128) {
                    utftext += String.fromCharCode(c);
                }
                else if ((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
                else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }

            }

            return utftext;
        },

        // private method for UTF-8 decoding
        _utf8_decode: function (utftext) {
            var string = "";
            var i = 0;
            var c = c1 = c2 = 0;

            while (i < utftext.length) {

                c = utftext.charCodeAt(i);

                if (c < 128) {
                    string += String.fromCharCode(c);
                    i++;
                }
                else if ((c > 191) && (c < 224)) {
                    c2 = utftext.charCodeAt(i + 1);
                    string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                    i += 2;
                }
                else {
                    c2 = utftext.charCodeAt(i + 1);
                    c3 = utftext.charCodeAt(i + 2);
                    string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3;
                }

            }

            return string;
        }

    };

    var ua = window.navigator.userAgent;
    var lg = window.navigator.language;
    var server_url = '/gma.gif';
    var url = getUrl();
    var referrer = getReferrer();
    var query = '?ua=' + Base64.encode(ua) + '&lg=' + lg + '&u=' + Base64.encode(url) + '&r=' + Base64.encode(referrer);
    var screenDetail = getScreenDetail();
    for (var p in screenDetail) {
        query += '&' + p + '=' + screenDetail[p];
    }
    var browserDetails = getBrowserDetails();
    
    query += '&engine=' + browserDetails.engine.name;
    query += '&browser=' + browserDetails.browser.name;
    query += '&extraBrowser=' + browserDetails.extraBrowser.name;
    query += '&mobile=' + browserDetails.mobile;


    var i = new Image(1, 1);
    i.src = server_url + query;
    i.onload = function () {
        //console.log('loaded');
    };
    i.onerror = function () {
        //console.log('error');
    };

    function getBrowserDetails() {
        var engine = {
            trident: 0,
            webkit: 0,
            gecko: 0,
            presto: 0,
            khtml: 0,
            name: "other",
            ver: null
        };
        var browser = {
            ie: 0,
            firefox: 0,
            chrome: 0,
            safari: 0,
            opera: 0,
            konq: 0,
            name: "other",
            ver: null
        };
        var extraBrowser = {
            name: "",
            ver: null
        };
        var system = {
            win: !1,
            mac: !1,
            x11: !1,
            name: "other"
        };
        var mobile = "other";
        var userAgent = window.navigator.userAgent;
        var platform = window.navigator.platform;
        var u, a;
        var f = function (engine) {
            var browser = 0;
            return parseFloat(engine.replace(/\./g, function () {
                return browser++ === 0 ? "." : "";
            }));
        };
        if (window.opera) {
            engine.ver = browser.ver = f(window.opera.version());
            engine.presto = browser.opera = parseFloat(engine.ver);
            engine.name = "presto";
            browser.name = "opera";
        }
        else if (/AppleWebKit\/(\S+)/.test(userAgent)) {
            engine.ver = f(RegExp.$1);
            engine.webkit = engine.ver;
            engine.name = "webkit";
            if (/Chrome\/(\S+)/.test(userAgent)) {
                browser.ver = f(RegExp.$1);
                browser.chrome = browser.ver;
                browser.name = "chrome";
            }
            else if (/Version\/(\S+)/.test(userAgent)) {
                browser.ver = f(RegExp.$1);
                browser.safari = browser.ver;
                browser.name = "safari";
            } else {
                var l = 1;
                engine.webkit < 100 ? l = 1 : engine.webkit < 312 ? l = 1.2 : engine.webkit < 412 ? l = 1.3 : l = 2;
                browser.safari = browser.ver = l;
                browser.name = "safari";
            }
        } else {
            if(/KHTML\/(\S+)/.test(userAgent) || /Konqueror\/([^;]+)/.test(userAgent)){
                engine.ver = browser.ver = f(RegExp.$1);
                engine.khtml = browser.konq = engine.ver;
                engine.name = "khtml";
                browser.name = "konq";
            } else if (/rv:([^\)]+)\) Gecko\/\d{8}/.test(userAgent)) {
                engine.ver = f(RegExp.$1);
                engine.gecko = engine.ver;
                engine.name = "gecko";
                if (/Firefox\/(\S+)/.test(userAgent)) {
                    browser.ver = f(RegExp.$1);
                    browser.firefox = browser.ver;
                    browser.name = "firefox";
                }
            } else if(/MSIE ([^;]+)/.test(userAgent)){
                engine.ver = browser.ver = f(RegExp.$1);
                engine.trident = browser.ie = engine.ver;
                engine.name = "trident";
                browser.name = "ie";
            }
        }
        extraBrowser.name = browser.name;
        extraBrowser.ver = browser.ver;
        if (u = userAgent.match(/360SE/)) {
            extraBrowser.name = "se360"; extraBrowser.ver = 3;
        }
        else if ((u = userAgent.match(/Maxthon/)) && (a = window.external)) {
            extraBrowser.name = "maxthon";
            try {
                extraBrowser.ver = f(a.max_version);
            } catch (c) {
                extraBrowser.ver = .1;
            }
        } else if (u = userAgent.match(/TencentTraveler\s([\d.]*)/)) {
            extraBrowser.name = "tt"; extraBrowser.ver = f(u[1]) || .1;
        }
        else if (u = userAgent.match(/TheWorld/)) {
            extraBrowser.name = "theworld"; extraBrowser.ver = 3;
        } else if (u = userAgent.match(/SE\s([\d.]*)/)) {
            extraBrowser.name = "sougou"; extraBrowser.ver = f(u[1]) || .1;
        }
        system.win = platform.indexOf("Win") == 0;
        system.mac = platform.indexOf("Mac") == 0;
        system.x11 = platform == "X11" || platform.indexOf("Linux") == 0;
        if (system.win) {
            if (/Win(?:dows )?([^do]{2})\s?(\d+\.\d+)?/.test(userAgent)) {
                if (RegExp["$1"] == "NT") switch (RegExp.$2) {
                    case "5.1":
                        system.win = "XP";
                        break;
                    case "6.1":
                        system.win = "7";
                        break;
                    case "5.0":
                        system.win = "2000";
                        break;
                    case "6.0":
                        system.win = "Vista";
                        break;
                    default:
                        system.win = "NT";
                } else {
                    RegExp["$1"] == "9x" ? system.win = "ME" : system.win = RegExp.$1;
                }
            }
            system.name = "windows" + system.win;
        }
        system.mac && (system.name = "mac");
        system.x11 && (system.name = "x11");
        if (system.win == "CE") {
            mobile = "windows mobile";
        } else if (/ Mobile\//.test(userAgent)) {
            mobile = "apple";
        } else if (u = userAgent.match(/NokiaN[^\/]*|Android \d\.\d|webOS\/\d\.\d/)) {
            mobile = u[0].toLowerCase();
        }

        return {
            engine: engine,
            browser: browser,
            extraBrowser: extraBrowser,
            system: system,
            mobile: mobile
        };
    };

    function getScreenDetail() {
        var screen = window.screen;
        return {
            w: screen.width
            , h: screen.height
            , aw: screen.availWidth
            , ag: screen.availHeight
            , iw: window.innerWidth
            , ih: window.innerHeight
            , ce: window.navigator.cookieEnabled
            , pl: window.navigator.platform
            , pd: window.navigator.product
            , je: window.navigator.javaEnabled()
            , ol: window.navigator.onLine
            , os: window.navigator.oscpu
            , ps: window.navigator.productSub
            , acn: window.navigator.appCodeName
            , an: window.navigator.appName
            , av: window.navigator.appVersion
            , mi: window.navigator.mimeTypes.length
            , pg: window.navigator.plugins.length
        };
    };

    function loadtime() {

    };

    function getReferrer() {
        return document.referrer;
    };

    function getUrl() {
        return window.location.href;
    };
})();
