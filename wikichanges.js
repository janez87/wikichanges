var os = require("os"),
    irc = require('irc'),
    _ = require('underscore')

function WikiChanges(opts) {
  if (! opts) opts = {};
  this.channels = opts.wikipedias || _.keys(wikipedias);
  this.ircNickname = opts.ircNickname || "wikichanges-" + os.hostname();
}

WikiChanges.prototype = {

  listen: function(callback) {
    this.callback = callback;
    this.client = new irc.Client('irc.wikimedia.org', this.ircNickname, {
      server: 'irc.wikimedia.org',
      port: 8001,
      nick: this.ircNickname,
      log: false,
      channels: this.channels
    });

    this.client.addListener('message', function(from, to, msg) {
      m = parse_msg(to, msg);
      if (m) callback(m);
    });

  }
}

function parse_msg(channel, msg) {
  // i guess this means i have two problems now? :-D
  var m = /\x0314\[\[\x0307(.+?)\x0314\]\]\x034 (.*?)\x0310.*\x0302(.*?)\x03.+\x0303(.+?)\x03.+\x03 (.*) \x0310(.*)\u0003.*/.exec(msg);
  if (! m) { 
      console.log("failed to parse: " + msg);
      return null;
  } 

  // convert change in characters to a (possibly negative) integer
  if (m[5]) {
    var delta = parseInt(/([+-]\d+)/.exec(m[5])[1]);
  } else {
    var delta = null;
  }

  // see if it looks like an anonymous edit
  var user = m[4];
  var anonymous = user.match(/\d+.\d+.\d+.\d+/) ? true : false;

  // unpack the flags
  var flag = m[2];
  var isRobot = flag.match(/B/) ? true : false;
  var isNewPage = flag.match(/N/) ? true : false;
  var isUnpatrolled = flag.match(/!/) ? true : false;

  var page = m[1];
  var wikipedia = wikipedias[channel]['long'];
  var wikipediaUrl = 'http://' + channel.replace('#', '') + '.org';
  if (channel == "#wikidata.wikipedia") {
    wikipediaUrl = "http://wikidata.org";
  }
  var pageUrl = wikipediaUrl + '/wiki/' + page.replace(/ /g, '_');
  var userUrl = wikipediaUrl + '/wiki/User:' + user;
  var namespace = getNamespace(wikipedia, page);

  return {
    channel: channel,
    flag: flag, 
    page: page, 
    pageUrl: pageUrl,
    url: m[3], 
    delta: delta,
    comment: m[6],
    wikipedia: wikipedia,
    wikipediaUrl: wikipediaUrl,
    wikipediaShort: wikipedias[channel].short,
    wikipediaLong: wikipedias[channel].long,
    user: user, 
    userUrl: userUrl,
    unpatrolled: isUnpatrolled,
    newPage: isNewPage,
    robot: isRobot,
    anonymous: anonymous,
    namespace: namespace
  }
}

function getNamespace(wikipedia, page) {
  ns = null;
  var parts = page.split(':');
  if (parts.length > 1 && parts[1][0] != " ") {
    ns = parts[0];
  } else {
    ns = 'Article';
  }
  return ns;
}

var wikipedias = {
  "#vo.wikipedia": {
    "short": "vo", 
    "long": "Volap\u00fck Wikipedia", 
    "namespaces": {
      "Patikos": "special", 
      "N\u00fcnamakan\u00e4d": "media", 
      "Bespik d\u00f6 sitanuns": "mediawiki talk", 
      "Ragivibespik": "file talk", 
      "Kladibespik": "category talk", 
      "Geban": "user", 
      "Klad": "category", 
      "Bespik": "talk", 
      "Yufibespik": "help talk", 
      "Gebanibespik": "user talk", 
      "Sitanuns": "mediawiki", 
      "Samafomotibespik": "template talk", 
      "Samafomot": "template", 
      "Bespik d\u00f6 $1": "project talk", 
      "Ragiv": "file", 
      "Yuf": "help"
    }
  }, 
  "#lt.wikipedia": {
    "short": "lt", 
    "long": "Lithuanian Wikipedia", 
    "namespaces": {
      "MediaWiki": "mediawiki", 
      "Aptarimas": "talk", 
      "Pagalba": "help", 
      "\u0160ablonas": "template", 
      "Medija": "media", 
      "Naudotojas": "user", 
      "Vaizdo aptarimas": "file talk", 
      "Naudotojo aptarimas": "user talk", 
      "Vaizdas": "file", 
      "Specialus": "special", 
      "MediaWiki aptarimas": "mediawiki talk", 
      "Kategorija": "category", 
      "$1 aptarimas": "project talk", 
      "\u0160ablono aptarimas": "template talk", 
      "Pagalbos aptarimas": "help talk", 
      "Kategorijos aptarimas": "category talk"
    }
  }, 
  "#id.wikipedia": {
    "short": "id", 
    "long": "Indonesian Wikipedia", 
    "namespaces": {
      "Pembicaraan MediaWiki": "mediawiki talk", 
      "Media": "media", 
      "Pembicaraan Templat": "template talk", 
      "MediaWiki": "mediawiki", 
      "Kategori": "category", 
      "Pembicaraan": "talk", 
      "Istimewa": "special", 
      "Pembicaraan Pengguna": "user talk", 
      "Pembicaraan Berkas": "file talk", 
      "Pembicaraan Kategori": "category talk", 
      "Berkas": "file", 
      "Pembicaraan $1": "project talk", 
      "Bantuan": "help", 
      "Pembicaraan Bantuan": "help talk", 
      "Templat": "template", 
      "Pengguna": "user"
    }
  }, 
  "#de.wikipedia": {
    "short": "de", 
    "long": "German Wikipedia", 
    "namespaces": {
      "Medium": "media", 
      "MediaWiki Diskussion": "mediawiki talk", 
      "Spezial": "special", 
      "Hilfe": "help", 
      "Benutzer Diskussion": "user talk", 
      "Vorlage Diskussion": "template talk", 
      "Vorlage": "template", 
      "MediaWiki": "mediawiki", 
      "Diskussion": "talk", 
      "Datei Diskussion": "file talk", 
      "Kategorie Diskussion": "category talk", 
      "Datei": "file", 
      "Hilfe Diskussion": "help talk", 
      "Kategorie": "category", 
      "$1 Diskussion": "project talk", 
      "Benutzer": "user"
    }
  }, 
  "#uk.wikipedia": {
    "short": "uk", 
    "long": "Ukrainian Wikipedia", 
    "namespaces": {
      "\u041e\u0431\u0433\u043e\u0432\u043e\u0440\u0435\u043d\u043d\u044f \u0448\u0430\u0431\u043b\u043e\u043d\u0443": "template talk", 
      "MediaWiki": "mediawiki", 
      "\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0456\u044f": "category", 
      "\u041c\u0435\u0434\u0456\u0430": "media", 
      "\u041e\u0431\u0433\u043e\u0432\u043e\u0440\u0435\u043d\u043d\u044f \u0444\u0430\u0439\u043b\u0443": "file talk", 
      "\u041e\u0431\u0433\u043e\u0432\u043e\u0440\u0435\u043d\u043d\u044f {{GRAMMAR:genitive|$1}}": "project talk", 
      "\u0414\u043e\u0432\u0456\u0434\u043a\u0430": "help", 
      "\u0428\u0430\u0431\u043b\u043e\u043d": "template", 
      "\u041e\u0431\u0433\u043e\u0432\u043e\u0440\u0435\u043d\u043d\u044f \u0434\u043e\u0432\u0456\u0434\u043a\u0438": "help talk", 
      "\u041e\u0431\u0433\u043e\u0432\u043e\u0440\u0435\u043d\u043d\u044f \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0456\u0457": "category talk", 
      "\u041a\u043e\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447": "user", 
      "\u041e\u0431\u0433\u043e\u0432\u043e\u0440\u0435\u043d\u043d\u044f MediaWiki": "mediawiki talk", 
      "\u041e\u0431\u0433\u043e\u0432\u043e\u0440\u0435\u043d\u043d\u044f": "talk", 
      "\u0424\u0430\u0439\u043b": "file", 
      "\u041e\u0431\u0433\u043e\u0432\u043e\u0440\u0435\u043d\u043d\u044f \u043a\u043e\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447\u0430": "user talk", 
      "\u0421\u043f\u0435\u0446\u0456\u0430\u043b\u044c\u043d\u0430": "special"
    }
  }, 
  "#el.wikipedia": {
    "short": "el", 
    "long": "Greek Wikipedia", 
    "namespaces": {
      "\u039c\u03ad\u03c3\u03bf": "media", 
      "MediaWiki": "mediawiki", 
      "\u03a7\u03c1\u03ae\u03c3\u03c4\u03b7\u03c2": "user", 
      "\u0395\u03b9\u03b4\u03b9\u03ba\u03cc": "special", 
      "$1 \u03c3\u03c5\u03b6\u03ae\u03c4\u03b7\u03c3\u03b7": "project talk", 
      "\u039a\u03b1\u03c4\u03b7\u03b3\u03bf\u03c1\u03af\u03b1": "category", 
      "\u03a0\u03c1\u03cc\u03c4\u03c5\u03c0\u03bf": "template", 
      "\u03a3\u03c5\u03b6\u03ae\u03c4\u03b7\u03c3\u03b7 \u03b1\u03c1\u03c7\u03b5\u03af\u03bf\u03c5": "file talk", 
      "\u03a3\u03c5\u03b6\u03ae\u03c4\u03b7\u03c3\u03b7 \u03c0\u03c1\u03bf\u03c4\u03cd\u03c0\u03bf\u03c5": "template talk", 
      "\u0391\u03c1\u03c7\u03b5\u03af\u03bf": "file", 
      "\u03a3\u03c5\u03b6\u03ae\u03c4\u03b7\u03c3\u03b7 \u03c7\u03c1\u03ae\u03c3\u03c4\u03b7": "user talk", 
      "\u0392\u03bf\u03ae\u03b8\u03b5\u03b9\u03b1": "help", 
      "\u03a3\u03c5\u03b6\u03ae\u03c4\u03b7\u03c3\u03b7 \u03b2\u03bf\u03ae\u03b8\u03b5\u03b9\u03b1\u03c2": "help talk", 
      "\u03a3\u03c5\u03b6\u03ae\u03c4\u03b7\u03c3\u03b7": "talk", 
      "\u03a3\u03c5\u03b6\u03ae\u03c4\u03b7\u03c3\u03b7 MediaWiki": "mediawiki talk", 
      "\u03a3\u03c5\u03b6\u03ae\u03c4\u03b7\u03c3\u03b7 \u03ba\u03b1\u03c4\u03b7\u03b3\u03bf\u03c1\u03af\u03b1\u03c2": "category talk"
    }
  }, 
  "#eo.wikipedia": {
    "short": "eo", 
    "long": "Esperanto Wikipedia", 
    "namespaces": {
      "Speciala": "special", 
      "MediaVikio": "mediawiki", 
      "Diskuto": "talk", 
      "Uzulo": "user", 
      "Uzula diskuto": "user talk", 
      "Dosiero": "file", 
      "Dosiera diskuto": "file talk", 
      "$1 diskuto": "project talk", 
      "A\u016ddvida\u0135o": "media", 
      "\u015cablono": "template", 
      "\u015cablona diskuto": "template talk", 
      "Kategorio": "category", 
      "Helpo": "help", 
      "MediaVikia diskuto": "mediawiki talk", 
      "Kategoria diskuto": "category talk", 
      "Helpa diskuto": "help talk"
    }
  }, 
  "#ar.wikipedia": {
    "short": "ar", 
    "long": "Arabic Wikipedia", 
    "namespaces": {
      "\u0646\u0642\u0627\u0634 \u0645\u064a\u062f\u064a\u0627\u0648\u064a\u0643\u064a": "mediawiki talk", 
      "\u0646\u0642\u0627\u0634 \u0627\u0644\u0642\u0627\u0644\u0628": "template talk", 
      "\u0642\u0627\u0644\u0628": "template", 
      "\u0646\u0642\u0627\u0634 \u0627\u0644\u0645\u0644\u0641": "file talk", 
      "\u0645\u0633\u0627\u0639\u062f\u0629": "help", 
      "\u0646\u0642\u0627\u0634 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645": "user talk", 
      "\u0646\u0642\u0627\u0634": "talk", 
      "\u062a\u0635\u0646\u064a\u0641": "category", 
      "\u0646\u0642\u0627\u0634 \u0627\u0644\u0645\u0633\u0627\u0639\u062f\u0629": "help talk", 
      "\u0646\u0642\u0627\u0634 $1": "project talk", 
      "\u0645\u0633\u062a\u062e\u062f\u0645": "user", 
      "\u0645\u064a\u062f\u064a\u0627": "media", 
      "\u0645\u064a\u062f\u064a\u0627\u0648\u064a\u0643\u064a": "mediawiki", 
      "\u0645\u0644\u0641": "file", 
      "\u062e\u0627\u0635": "special", 
      "\u0646\u0642\u0627\u0634 \u0627\u0644\u062a\u0635\u0646\u064a\u0641": "category talk"
    }
  }, 
  "#tr.wikipedia": {
    "short": "tr", 
    "long": "Turkish Wikipedia", 
    "namespaces": {
      "Kullan\u0131c\u0131 mesaj": "user talk", 
      "\u00d6zel": "special", 
      "MediaWiki": "mediawiki", 
      "$1 tart\u0131\u015fma": "project talk", 
      "Kategori": "category", 
      "Dosya": "file", 
      "Dosya tart\u0131\u015fma": "file talk", 
      "\u015eablon tart\u0131\u015fma": "template talk", 
      "\u015eablon": "template", 
      "Tart\u0131\u015fma": "talk", 
      "Yard\u0131m tart\u0131\u015fma": "help talk", 
      "MediaWiki tart\u0131\u015fma": "mediawiki talk", 
      "Kategori tart\u0131\u015fma": "category talk", 
      "Kullan\u0131c\u0131": "user", 
      "Yard\u0131m": "help", 
      "Medya": "media"
    }
  }, 
  "#he.wikipedia": {
    "short": "he", 
    "long": "Hebrew Wikipedia", 
    "namespaces": {
      "": "main", 
      "\u05e9\u05d9\u05d7\u05ea \u05e7\u05d8\u05d2\u05d5\u05e8\u05d9\u05d4": "category talk", 
      "\u05e9\u05d9\u05d7\u05ea \u05e2\u05d6\u05e8\u05d4": "help talk", 
      "\u05e9\u05d9\u05d7\u05d4": "talk", 
      "\u05de\u05d3\u05d9\u05d4 \u05d5\u05d9\u05e7\u05d9": "mediawiki", 
      "\u05e9\u05d9\u05d7\u05ea \u05ea\u05d1\u05e0\u05d9\u05ea": "template talk", 
      "\u05e9\u05d9\u05d7\u05ea \u05de\u05e9\u05ea\u05de\u05e9": "user talk", 
      "\u05e7\u05d8\u05d2\u05d5\u05e8\u05d9\u05d4": "category", 
      "\u05e9\u05d9\u05d7\u05ea \u05e7\u05d5\u05d1\u05e5": "file talk", 
      "\u05e7\u05d5\u05d1\u05e5": "file", 
      "\u05e9\u05d9\u05d7\u05ea \u05de\u05d3\u05d9\u05d4 \u05d5\u05d9\u05e7\u05d9": "mediawiki talk", 
      "\u05ea\u05d1\u05e0\u05d9\u05ea": "template", 
      "\u05de\u05d3\u05d9\u05d4": "media", 
      "\u05e9\u05d9\u05d7\u05ea $1": "project talk", 
      "\u05e2\u05d6\u05e8\u05d4": "help", 
      "\u05de\u05e9\u05ea\u05de\u05e9": "user", 
      "\u05de\u05d9\u05d5\u05d7\u05d3": "special"
    }
  }, 
  "#ru.wikipedia": {
    "short": "ru", 
    "long": "Russian Wikipedia", 
    "namespaces": {
      "\u041c\u0435\u0434\u0438\u0430": "media", 
      "\u041e\u0431\u0441\u0443\u0436\u0434\u0435\u043d\u0438\u0435 {{GRAMMAR:genitive|$1}}": "project talk", 
      "\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f": "category", 
      "\u041e\u0431\u0441\u0443\u0436\u0434\u0435\u043d\u0438\u0435 \u0444\u0430\u0439\u043b\u0430": "file talk", 
      "MediaWiki": "mediawiki", 
      "\u041e\u0431\u0441\u0443\u0436\u0434\u0435\u043d\u0438\u0435 \u0441\u043f\u0440\u0430\u0432\u043a\u0438": "help talk", 
      "\u041e\u0431\u0441\u0443\u0436\u0434\u0435\u043d\u0438\u0435 \u0448\u0430\u0431\u043b\u043e\u043d\u0430": "template talk", 
      "\u041e\u0431\u0441\u0443\u0436\u0434\u0435\u043d\u0438\u0435": "talk", 
      "\u041e\u0431\u0441\u0443\u0436\u0434\u0435\u043d\u0438\u0435 \u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u0430": "user talk", 
      "\u0421\u043b\u0443\u0436\u0435\u0431\u043d\u0430\u044f": "special", 
      "\u0428\u0430\u0431\u043b\u043e\u043d": "template", 
      "\u0421\u043f\u0440\u0430\u0432\u043a\u0430": "help", 
      "\u0423\u0447\u0430\u0441\u0442\u043d\u0438\u043a": "user", 
      "\u041e\u0431\u0441\u0443\u0436\u0434\u0435\u043d\u0438\u0435 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438": "category talk", 
      "\u041e\u0431\u0441\u0443\u0436\u0434\u0435\u043d\u0438\u0435 MediaWiki": "mediawiki talk", 
      "\u0424\u0430\u0439\u043b": "file"
    }
  }, 
  "#fi.wikipedia": {
    "short": "fi", 
    "long": "Finnish Wikipedia", 
    "namespaces": {
      "Keskustelu k\u00e4ytt\u00e4j\u00e4st\u00e4": "user talk", 
      "Media": "media", 
      "Ohje": "help", 
      "Keskustelu ohjeesta": "help talk", 
      "J\u00e4rjestelm\u00e4viesti": "mediawiki", 
      "Keskustelu luokasta": "category talk", 
      "Keskustelu mallineesta": "template talk", 
      "Luokka": "category", 
      "Toiminnot": "special", 
      "Keskustelu {{GRAMMAR:elative|$1}}": "project talk", 
      "Tiedosto": "file", 
      "K\u00e4ytt\u00e4j\u00e4": "user", 
      "Keskustelu j\u00e4rjestelm\u00e4viestist\u00e4": "mediawiki talk", 
      "Keskustelu": "talk", 
      "Keskustelu tiedostosta": "file talk", 
      "Malline": "template"
    }
  }, 
  "#eu.wikipedia": {
    "short": "eu", 
    "long": "Euskara Wikipedia", 
    "namespaces": {
      "Lankide": "user", 
      "Media": "media", 
      "Laguntza": "help", 
      "MediaWiki": "mediawiki", 
      "Eztabaida": "talk", 
      "Txantiloi eztabaida": "template talk", 
      "Fitxategi eztabaida": "file talk", 
      "Lankide eztabaida": "user talk", 
      "$1 eztabaida": "project talk", 
      "Kategoria eztabaida": "category talk", 
      "Txantiloi": "template", 
      "Kategoria": "category", 
      "Berezi": "special", 
      "Fitxategi": "file", 
      "MediaWiki eztabaida": "mediawiki talk", 
      "Laguntza eztabaida": "help talk"
    }
  }, 
  "#sl.wikipedia": {
    "short": "sl", 
    "long": "Slovene Wikipedia", 
    "namespaces": {
      "MediaWiki": "mediawiki", 
      "Slika": "file", 
      "Datoteka": "media", 
      "Pogovor o kategoriji": "category talk", 
      "Pogovor o sliki": "file talk", 
      "Posebno": "special", 
      "Uporabni\u0161ki pogovor": "user talk", 
      "Pogovor o predlogi": "template talk", 
      "Predloga": "template", 
      "Pogovor o MediaWiki": "mediawiki talk", 
      "Pogovor": "talk", 
      "Kategorija": "category", 
      "Uporabnik": "user", 
      "Pogovor {{grammar:mestnik|$1}}": "project talk", 
      "Pomo\u010d": "help", 
      "Pogovor o pomo\u010di": "help talk"
    }
  }, 
  "#nl.wikipedia": {
    "short": "nl", 
    "long": "Dutch Wikipedia", 
    "namespaces": {
      "Media": "media", 
      "Overleg categorie": "category talk", 
      "MediaWiki": "mediawiki", 
      "Overleg $1": "project talk", 
      "Overleg help": "help talk", 
      "Overleg bestand": "file talk", 
      "Overleg sjabloon": "template talk", 
      "Categorie": "category", 
      "Bestand": "file", 
      "Overleg MediaWiki": "mediawiki talk", 
      "Speciaal": "special", 
      "Sjabloon": "template", 
      "Help": "help", 
      "Overleg": "talk", 
      "Overleg gebruiker": "user talk", 
      "Gebruiker": "user"
    }
  }, 
  "#pl.wikipedia": {
    "short": "pl", 
    "long": "Polish Wikipedia", 
    "namespaces": {
      "Dyskusja kategorii": "category talk", 
      "Dyskusja $1": "project talk", 
      "MediaWiki": "mediawiki", 
      "Kategoria": "category", 
      "Media": "media", 
      "Dyskusja szablonu": "template talk", 
      "Szablon": "template", 
      "Plik": "file", 
      "Dyskusja pliku": "file talk", 
      "Dyskusja": "talk", 
      "U\u017cytkownik": "user", 
      "Dyskusja u\u017cytkownika": "user talk", 
      "Specjalna": "special", 
      "Pomoc": "help", 
      "Dyskusja pomocy": "help talk", 
      "Dyskusja MediaWiki": "mediawiki talk"
    }
  }, 
  "#sv.wikipedia": {
    "short": "sv", 
    "long": "Swedish Wikipedia", 
    "namespaces": {
      "Anv\u00e4ndare": "user", 
      "Kategori": "category", 
      "MediaWiki": "mediawiki", 
      "Malldiskussion": "template talk", 
      "Media": "media", 
      "Fildiskussion": "file talk", 
      "$1diskussion": "project talk", 
      "MediaWiki-diskussion": "mediawiki talk", 
      "Hj\u00e4lpdiskussion": "help talk", 
      "Anv\u00e4ndardiskussion": "user talk", 
      "Fil": "file", 
      "Mall": "template", 
      "Kategoridiskussion": "category talk", 
      "Hj\u00e4lp": "help", 
      "Special": "special", 
      "Diskussion": "talk"
    }
  }, 
  "#cs.wikipedia": {
    "short": "cs", 
    "long": "Czech Wikipedia", 
    "namespaces": {
      "Diskuse k n\u00e1pov\u011bd\u011b": "help talk", 
      "U\u017eivatel": "user", 
      "MediaWiki": "mediawiki", 
      "Diskuse k \u0161ablon\u011b": "template talk", 
      "Soubor": "file", 
      "Diskuse": "talk", 
      "Diskuse k souboru": "file talk", 
      "Diskuse k MediaWiki": "mediawiki talk", 
      "Diskuse ke kategorii": "category talk", 
      "Diskuse k {{grammar:3sg|$1}}": "project talk", 
      "N\u00e1pov\u011bda": "help", 
      "Kategorie": "category", 
      "\u0160ablona": "template", 
      "Speci\u00e1ln\u00ed": "special", 
      "M\u00e9dia": "media", 
      "Diskuse s u\u017eivatelem": "user talk"
    }
  }, 
  "#pt.wikipedia": {
    "short": "pt", 
    "long": "Portuguese Wikipedia", 
    "namespaces": {
      "Categoria": "category", 
      "Discuss\u00e3o": "talk", 
      "Especial": "special", 
      "Predefini\u00e7\u00e3o": "template", 
      "Predefini\u00e7\u00e3o Discuss\u00e3o": "template talk", 
      "Ficheiro": "file", 
      "Ajuda": "help", 
      "Utilizador Discuss\u00e3o": "user talk", 
      "Ajuda Discuss\u00e3o": "help talk", 
      "MediaWiki": "mediawiki", 
      "MediaWiki Discuss\u00e3o": "mediawiki talk", 
      "Ficheiro Discuss\u00e3o": "file talk", 
      "Utilizador": "user", 
      "$1 Discuss\u00e3o": "project talk", 
      "Categoria Discuss\u00e3o": "category talk", 
      "Multim\u00e9dia": "media"
    }
  }, 
  "#ro.wikipedia": {
    "short": "ro", 
    "long": "Romanian Wikipedia", 
    "namespaces": {
      "Ajutor": "help", 
      "Categorie": "category", 
      "Discu\u021bie Categorie": "category talk", 
      "Utilizator": "user", 
      "Media": "media", 
      "Format": "template", 
      "Discu\u021bie Utilizator": "user talk", 
      "MediaWiki": "mediawiki", 
      "Discu\u021bie Fi\u0219ier": "file talk", 
      "Discu\u021bie": "talk", 
      "Fi\u0219ier": "file", 
      "Discu\u021bie Ajutor": "help talk", 
      "Discu\u021bie $1": "project talk", 
      "Discu\u021bie MediaWiki": "mediawiki talk", 
      "Discu\u021bie Format": "template talk", 
      "Special": "special"
    }
  }, 
  "#it.wikipedia": {
    "short": "it", 
    "long": "Italian Wikipedia", 
    "namespaces": {
      "Media": "media", 
      "MediaWiki": "mediawiki", 
      "Template": "template", 
      "Categoria": "category", 
      "Discussioni file": "file talk", 
      "Discussioni aiuto": "help talk", 
      "Discussioni categoria": "category talk", 
      "Discussioni template": "template talk", 
      "Discussioni $1": "project talk", 
      "Speciale": "special", 
      "Utente": "user", 
      "Discussioni utente": "user talk", 
      "Discussioni MediaWiki": "mediawiki talk", 
      "Discussione": "talk", 
      "File": "file", 
      "Aiuto": "help"
    }
  }, 
  "#sk.wikipedia": {
    "short": "sk", 
    "long": "Slovak Wikipedia", 
    "namespaces": {
      "Diskusia k pomoci": "help talk", 
      "MediaWiki": "mediawiki", 
      "Pomoc": "help", 
      "Redaktor": "user", 
      "Diskusia k s\u00faboru": "file talk", 
      "Diskusia ku kateg\u00f3rii": "category talk", 
      "Diskusia s redaktorom": "user talk", 
      "Diskusia k {{GRAMMAR:dat\u00edv|$1}}": "project talk", 
      "Diskusia k \u0161abl\u00f3ne": "template talk", 
      "S\u00fabor": "file", 
      "\u0160peci\u00e1lne": "special", 
      "Kateg\u00f3ria": "category", 
      "Diskusia": "talk", 
      "M\u00e9di\u00e1": "media", 
      "Diskusia k MediaWiki": "mediawiki talk", 
      "\u0160abl\u00f3na": "template"
    }
  }, 
  "#ca.wikipedia": {
    "short": "ca", 
    "long": "Catalan Wikipedia", 
    "namespaces": {
      "Media": "media", 
      "Ajuda": "help", 
      "MediaWiki": "mediawiki", 
      "Usuari Discussi\u00f3": "user talk", 
      "Plantilla Discussi\u00f3": "template talk", 
      "Categoria": "category", 
      "Especial": "special", 
      "Usuari": "user", 
      "MediaWiki Discussi\u00f3": "mediawiki talk", 
      "Categoria Discussi\u00f3": "category talk", 
      "$1 Discussi\u00f3": "project talk", 
      "Plantilla": "template", 
      "Fitxer Discussi\u00f3": "file talk", 
      "Discussi\u00f3": "talk", 
      "Ajuda Discussi\u00f3": "help talk", 
      "Fitxer": "file"
    }
  }, 
  "#no.wikipedia": {
    "short": "no", 
    "long": "Norwegian Wikipedia", 
    "namespaces": {
      "Medium": "media", 
      "Kategoridiskusjon": "category talk", 
      "$1-diskusjon": "project talk", 
      "Brukerdiskusjon": "user talk", 
      "Hjelp": "help", 
      "Bruker": "user", 
      "MediaWiki-diskusjon": "mediawiki talk", 
      "Diskusjon": "talk", 
      "Spesial": "special", 
      "MediaWiki": "mediawiki", 
      "Hjelpdiskusjon": "help talk", 
      "Kategori": "category", 
      "Maldiskusjon": "template talk", 
      "Fildiskusjon": "file talk", 
      "Mal": "template", 
      "Fil": "file"
    }
  }, 
  "#es.wikipedia": {
    "short": "es", 
    "long": "Spanish Wikipedia", 
    "namespaces": {
      "Media": "media", 
      "MediaWiki": "mediawiki", 
      "Plantilla Discusi\u00f3n": "template talk", 
      "Discusi\u00f3n": "talk", 
      "Especial": "special", 
      "Usuario Discusi\u00f3n": "user talk", 
      "$1 Discusi\u00f3n": "project talk", 
      "Categor\u00eda Discusi\u00f3n": "category talk", 
      "Categor\u00eda": "category", 
      "Ayuda Discusi\u00f3n": "help talk", 
      "Usuario": "user", 
      "MediaWiki Discusi\u00f3n": "mediawiki talk", 
      "Plantilla": "template", 
      "Archivo Discusi\u00f3n": "file talk", 
      "Archivo": "file", 
      "Ayuda": "help"
    }
  }, 
  "#ko.wikipedia": {
    "short": "ko", 
    "long": "Korean Wikipedia", 
    "namespaces": {
      "$1\ud1a0\ub860": "project talk", 
      "\ud1a0\ub860": "talk", 
      "\ubbf8\ub514\uc5b4": "media", 
      "\ud2c0": "template", 
      "\uc0ac\uc6a9\uc790\ud1a0\ub860": "user talk", 
      "\ubbf8\ub514\uc5b4\uc704\ud0a4": "mediawiki", 
      "\ubbf8\ub514\uc5b4\uc704\ud0a4\ud1a0\ub860": "mediawiki talk", 
      "\ubd84\ub958\ud1a0\ub860": "category talk", 
      "\ub3c4\uc6c0\ub9d0\ud1a0\ub860": "help talk", 
      "\ud2c0\ud1a0\ub860": "template talk", 
      "\uc0ac\uc6a9\uc790": "user", 
      "\ubd84\ub958": "category", 
      "\ub3c4\uc6c0\ub9d0": "help", 
      "\ud30c\uc77c": "file", 
      "\ud30c\uc77c\ud1a0\ub860": "file talk", 
      "\ud2b9\uc218\uae30\ub2a5": "special"
    }
  }, 
  "#hu.wikipedia": {
    "short": "hu", 
    "long": "Hungarian Wikipedia", 
    "namespaces": {
      "$1-vita": "project talk", 
      "Sablonvita": "template talk", 
      "Speci\u00e1lis": "special", 
      "F\u00e1jl": "file", 
      "Seg\u00edts\u00e9gvita": "help talk", 
      "Kateg\u00f3ria": "category", 
      "M\u00e9dia": "media", 
      "F\u00e1jlvita": "file talk", 
      "MediaWiki": "mediawiki", 
      "Sablon": "template", 
      "Seg\u00edts\u00e9g": "help", 
      "MediaWiki-vita": "mediawiki talk", 
      "Vita": "talk", 
      "Szerkeszt\u0151vita": "user talk", 
      "Kateg\u00f3riavita": "category talk", 
      "Szerkeszt\u0151": "user"
    }
  }, 
  "#fa.wikipedia": {
    "short": "fa", 
    "long": "Farsi Wikipedia", 
    "namespaces": {
      "": "main", 
      "\u0628\u062d\u062b \u0631\u062f\u0647": "category talk", 
      "\u0628\u062d\u062b \u0631\u0627\u0647\u0646\u0645\u0627": "help talk", 
      "\u0628\u062d\u062b": "talk", 
      "\u0631\u0627\u0647\u0646\u0645\u0627": "help", 
      "\u0645\u062f\u06cc\u0627": "media", 
      "\u0628\u062d\u062b \u0627\u0644\u06af\u0648": "template talk", 
      "\u0648\u06cc\u0698\u0647": "special", 
      "\u0631\u062f\u0647": "category", 
      "\u0628\u062d\u062b \u06a9\u0627\u0631\u0628\u0631": "user talk", 
      "\u06a9\u0627\u0631\u0628\u0631": "user", 
      "\u067e\u0631\u0648\u0646\u062f\u0647": "file", 
      "\u0628\u062d\u062b \u0645\u062f\u06cc\u0627\u0648\u06cc\u06a9\u06cc": "mediawiki talk", 
      "\u0628\u062d\u062b $1": "project talk", 
      "\u0645\u062f\u06cc\u0627\u0648\u06cc\u06a9\u06cc": "mediawiki", 
      "\u0628\u062d\u062b \u067e\u0631\u0648\u0646\u062f\u0647": "file talk", 
      "\u0627\u0644\u06af\u0648": "template"
    }
  }, 
  "#zh.wikipedia": {
    "short": "zh", 
    "long": "Chinese Wikipedia", 
    "namespaces": {
      "Category": "category", 
      "Media": "media", 
      "MediaWiki": "mediawiki", 
      "Template": "template", 
      "$1 talk": "project talk", 
      "Help talk": "help talk", 
      "User": "user", 
      "Template talk": "template talk", 
      "MediaWiki talk": "mediawiki talk", 
      "Talk": "talk", 
      "Help": "help", 
      "File talk": "file talk", 
      "File": "file", 
      "User talk": "user talk", 
      "Special": "special", 
      "Category talk": "category talk"
    }
  }, 
  "#fr.wikipedia": {
    "short": "fr", 
    "long": "French Wikipedia", 
    "namespaces": {
      "Fichier": "file", 
      "Sp\u00e9cial": "special", 
      "Discussion aide": "help talk", 
      "Discussion mod\u00e8le": "template talk", 
      "Discussion": "talk", 
      "Mod\u00e8le": "template", 
      "Discussion MediaWiki": "mediawiki talk", 
      "Utilisateur": "user", 
      "Aide": "help", 
      "Cat\u00e9gorie": "category", 
      "MediaWiki": "mediawiki", 
      "Discussion $1": "project talk", 
      "Discussion utilisateur": "user talk", 
      "Discussion fichier": "file talk", 
      "Discussion cat\u00e9gorie": "category talk", 
      "M\u00e9dia": "media"
    }
  }, 
  "#ja.wikipedia": {
    "short": "ja", 
    "long": "Japanese Wikipedia", 
    "namespaces": {
      "\u30c8\u30fc\u30af": "talk", 
      "$1\u30fb\u30c8\u30fc\u30af": "project talk", 
      "\u30d5\u30a1\u30a4\u30eb\u30fb\u30c8\u30fc\u30af": "file talk", 
      "\u5229\u7528\u8005\u30fb\u30c8\u30fc\u30af": "user talk", 
      "\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u30fb\u30c8\u30fc\u30af": "template talk", 
      "\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8": "template", 
      "\u30ab\u30c6\u30b4\u30ea\u30fb\u30c8\u30fc\u30af": "category talk", 
      "\u7279\u5225": "special", 
      "\u30ab\u30c6\u30b4\u30ea": "category", 
      "MediaWiki\u30fb\u30c8\u30fc\u30af": "mediawiki talk", 
      "MediaWiki": "mediawiki", 
      "\u30d5\u30a1\u30a4\u30eb": "file", 
      "\u30e1\u30c7\u30a3\u30a2": "media", 
      "\u5229\u7528\u8005": "user", 
      "\u30d8\u30eb\u30d7": "help", 
      "\u30d8\u30eb\u30d7\u30fb\u30c8\u30fc\u30af": "help talk"
    }
  }, 
  "#bg.wikipedia": {
    "short": "bg", 
    "long": "Bulgarian Wikipedia", 
    "namespaces": {
      "\u0428\u0430\u0431\u043b\u043e\u043d": "template", 
      "\u0421\u043f\u0435\u0446\u0438\u0430\u043b\u043d\u0438": "special", 
      "\u041f\u043e\u043c\u043e\u0449 \u0431\u0435\u0441\u0435\u0434\u0430": "help talk", 
      "$1 \u0431\u0435\u0441\u0435\u0434\u0430": "project talk", 
      "\u0411\u0435\u0441\u0435\u0434\u0430": "talk", 
      "\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f": "category", 
      "\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f \u0431\u0435\u0441\u0435\u0434\u0430": "category talk", 
      "\u041c\u0435\u0434\u0438\u044f\u0423\u0438\u043a\u0438": "mediawiki", 
      "\u041f\u043e\u043c\u043e\u0449": "help", 
      "\u0428\u0430\u0431\u043b\u043e\u043d \u0431\u0435\u0441\u0435\u0434\u0430": "template talk", 
      "\u041f\u043e\u0442\u0440\u0435\u0431\u0438\u0442\u0435\u043b": "user", 
      "\u0424\u0430\u0439\u043b \u0431\u0435\u0441\u0435\u0434\u0430": "file talk", 
      "\u0424\u0430\u0439\u043b": "file", 
      "\u041c\u0435\u0434\u0438\u044f\u0423\u0438\u043a\u0438 \u0431\u0435\u0441\u0435\u0434\u0430": "mediawiki talk", 
      "\u041f\u043e\u0442\u0440\u0435\u0431\u0438\u0442\u0435\u043b \u0431\u0435\u0441\u0435\u0434\u0430": "user talk", 
      "\u041c\u0435\u0434\u0438\u044f": "media"
    }
  }, 
  "#ms.wikipedia": {
    "short": "ms", 
    "long": "Malaysian Wikipedia", 
    "namespaces": {
      "Perbincangan": "talk", 
      "Perbincangan Templat": "template talk", 
      "Perbincangan Kategori": "category talk", 
      "MediaWiki": "mediawiki", 
      "Media": "media", 
      "Perbincangan Pengguna": "user talk", 
      "Perbincangan Fail": "file talk", 
      "Templat": "template", 
      "Pengguna": "user", 
      "Fail": "file", 
      "Perbincangan MediaWiki": "mediawiki talk", 
      "Kategori": "category", 
      "Khas": "special", 
      "Perbincangan $1": "project talk", 
      "Bantuan": "help", 
      "Perbincangan Bantuan": "help talk"
    }
  }, 
  "#en.wikipedia": {
    "short": "en", 
    "long": "English Wikipedia", 
    "namespaces": {
      "": "main", 
      "Category": "category", 
      "Media": "media", 
      "MediaWiki": "mediawiki", 
      "Template": "template", 
      "$1 talk": "project talk", 
      "Help talk": "help talk", 
      "User": "user", 
      "Template talk": "template talk", 
      "MediaWiki talk": "mediawiki talk", 
      "Talk": "talk", 
      "Help": "help", 
      "File talk": "file talk", 
      "File": "file", 
      "User talk": "user talk", 
      "Special": "special", 
      "Category talk": "category talk"
    }
  }, 
  "#commons.wikimedia": {
    "short": "co", 
    "long": "Wikimedia Commons", 
    "namespaces": {
      "": "main", 
      "Category": "category", 
      "Media": "media", 
      "MediaWiki": "mediawiki", 
      "Template": "template", 
      "$1 talk": "project talk", 
      "Help talk": "help talk", 
      "User": "user", 
      "Template talk": "template talk", 
      "MediaWiki talk": "mediawiki talk", 
      "Talk": "talk", 
      "Help": "help", 
      "File talk": "file talk", 
      "File": "file", 
      "User talk": "user talk", 
      "Special": "special", 
      "Category talk": "category talk"
    }
  }, 
  "#vi.wikipedia": {
    "short": "vi", 
    "long": "Vietnamese Wikipedia", 
    "namespaces": {
      "Th\u1ea3o lu\u1eadn $1": "project talk", 
      "Tr\u1ee3 gi\u00fap": "help", 
      "Th\u1ec3 lo\u1ea1i": "category", 
      "MediaWiki": "mediawiki", 
      "Th\u1ea3o lu\u1eadn Tr\u1ee3 gi\u00fap": "help talk", 
      "Th\u1ea3o lu\u1eadn Th\u00e0nh vi\u00ean": "user talk", 
      "\u0110\u1eb7c bi\u1ec7t": "special", 
      "T\u1eadp tin": "file", 
      "Th\u1ea3o lu\u1eadn B\u1ea3n m\u1eabu": "template talk", 
      "B\u1ea3n m\u1eabu": "template", 
      "Th\u1ea3o lu\u1eadn": "talk", 
      "Th\u1ea3o lu\u1eadn T\u1eadp tin": "file talk", 
      "Ph\u01b0\u01a1ng ti\u1ec7n": "media", 
      "Th\u1ea3o lu\u1eadn Th\u1ec3 lo\u1ea1i": "category talk", 
      "Th\u00e0nh vi\u00ean": "user", 
      "Th\u1ea3o lu\u1eadn MediaWiki": "mediawiki talk"
    }
  }, 
  "#da.wikipedia": {
    "short": "da", 
    "long": "Danish Wikipedia", 
    "namespaces": {
      "Hj\u00e6lp": "help", 
      "Speciel": "special", 
      "MediaWiki diskussion": "mediawiki talk", 
      "Bruger": "user", 
      "Media": "media", 
      "Fildiskussion": "file talk", 
      "MediaWiki": "mediawiki", 
      "Diskussion": "talk", 
      "Hj\u00e6lp diskussion": "help talk", 
      "Brugerdiskussion": "user talk", 
      "Skabelon": "template", 
      "Kategori": "category", 
      "Skabelondiskussion": "template talk", 
      "Kategoridiskussion": "category talk", 
      "Fil": "file", 
      "$1 diskussion": "project talk"
    }
  },
  "#wikidata.wikipedia": {
    "short": "wd", 
    "long": "Wikidata", 
    "namespaces": {
      "": "main", 
      "Category": "category", 
      "Media": "media", 
      "MediaWiki": "mediawiki", 
      "Template": "template", 
      "$1 talk": "project talk", 
      "Help talk": "help talk", 
      "User": "user", 
      "Template talk": "template talk", 
      "MediaWiki talk": "mediawiki talk", 
      "Talk": "talk", 
      "Help": "help", 
      "File talk": "file talk", 
      "File": "file", 
      "User talk": "user talk", 
      "Special": "special", 
      "Category talk": "category talk"
    }
  }
}

exports.WikiChanges = WikiChanges;
exports.wikipedias = wikipedias
