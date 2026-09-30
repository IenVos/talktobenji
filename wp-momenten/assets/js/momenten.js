/**
 * Momenten - frontend flow.
 * Vanilla JavaScript, geen externe bibliotheken. Rendert de begeleide gids in
 * het element met data-momenten-root en stuurt de inzending naar het REST-eindpunt.
 */
(function () {
	'use strict';

	var cfg = window.MOMENTEN_CONFIG;
	var root = document.querySelector('[data-momenten-root]');
	if (!cfg || !root) {
		return;
	}

	var content = cfg.content || {};
	var momenten = Array.isArray(content.momenten) ? content.momenten : [];
	var OPSLAG = 'mmt-antwoorden';

	// Kleuren als CSS-variabelen zetten.
	root.style.setProperty('--mmt-accent', cfg.kleuren.accent);
	root.style.setProperty('--mmt-tekst', cfg.kleuren.tekst);
	root.style.setProperty('--mmt-bg', cfg.kleuren.achtergrond);
	if (cfg.kleuren.kaart) {
		root.style.setProperty('--mmt-kaart-bg', cfg.kleuren.kaart);
	}

	// Achtergrond doorzichtig (achtergrond van de website) en/of een rand.
	if (cfg.transparant) {
		root.style.background = 'transparent';
	}
	if (cfg.rand) {
		root.style.border = '2px solid ' + cfg.randKleur;
	}
	// Afronding van de hoeken.
	if (cfg.radius !== undefined && cfg.radius !== '' && cfg.radius !== null) {
		root.style.setProperty('--mmt-radius', parseInt(cfg.radius, 10) + 'px');
	}
	// Eigen lettertype (leeg = het lettertype van de website gebruiken).
	if (cfg.fontStack) {
		root.style.fontFamily = cfg.fontStack;
	}

	// Antwoorden (met autosave in localStorage).
	var antwoorden = laadOpgeslagen();

	// Stappen: welkom, elk moment, bewaar. "afrond" komt na verzenden.
	var stappen = ['welkom'].concat(momenten.map(function (m) { return m.id; })).concat(['bewaar']);
	var huidig = 0;
	var verzendBezig = false;

	teken();

	/* ---------- helpers ---------- */

	function laadOpgeslagen() {
		try {
			var raw = window.localStorage.getItem(OPSLAG);
			return raw ? JSON.parse(raw) : {};
		} catch (e) {
			return {};
		}
	}
	function bewaarOpgeslagen() {
		try {
			window.localStorage.setItem(OPSLAG, JSON.stringify(antwoorden));
		} catch (e) {}
	}
	function wisOpgeslagen() {
		try {
			window.localStorage.removeItem(OPSLAG);
		} catch (e) {}
	}

	function el(tag, klasse, tekst) {
		var e = document.createElement(tag);
		if (klasse) { e.className = klasse; }
		if (tekst != null) { e.textContent = tekst; }
		return e;
	}

	// Splits een tekst in alinea's (lege regel = nieuwe alinea).
	function alineas(tekst) {
		if (!tekst) { return []; }
		return String(tekst).split(/\n\s*\n/).map(function (a) { return a.trim(); }).filter(Boolean);
	}

	function momentById(id) {
		for (var i = 0; i < momenten.length; i++) {
			if (momenten[i].id === id) { return momenten[i]; }
		}
		return null;
	}

	/* ---------- render ---------- */

	function teken() {
		root.innerHTML = '';
		var kaart = el('div', 'mmt-kaart');

		var sleutel = stappen[huidig];
		if (sleutel === 'welkom') {
			tekenWelkom(kaart);
		} else if (sleutel === 'bewaar') {
			tekenBewaar(kaart);
		} else if (sleutel === 'afrond') {
			tekenAfrond(kaart);
		} else {
			tekenMoment(kaart, momentById(sleutel));
		}

		// Kop: logo aan de zijkant naast de stappenbalk.
		var kop = el('div', 'mmt-kop' + (cfg.logo ? ' met-logo' : '') + (cfg.logo && cfg.logoUitsteken ? ' uitsteken' : ''));
		if (cfg.logo) {
			var logo = el('img', 'mmt-logo');
			logo.src = cfg.logo;
			logo.alt = '';
			kop.appendChild(logo);
		}
		kop.appendChild(tekenStappenbalk());
		root.appendChild(kop);

		root.appendChild(kaart);
		if (sleutel !== 'afrond') {
			root.appendChild(tekenNavigatie());
		}
		// Bewust niet scrollen: de pagina moet blijven staan waar hij staat.
	}

	function tekenStappenbalk() {
		var wrap = el('div', 'mmt-tabs');
		stappen.forEach(function (id, i) {
			if (id === 'afrond') { return; }
			var label = id === 'welkom' ? 'Welkom' : id === 'bewaar' ? 'Bewaar' : (momentById(id) ? momentById(id).nav : '');
			var b = el('button', 'mmt-tab' + (i === huidig ? ' actief' : ''), label);
			b.type = 'button';
			b.addEventListener('click', function () { huidig = i; teken(); });
			wrap.appendChild(b);
		});
		return wrap;
	}

	function tekenWelkom(kaart) {
		var w = content.welkom || {};
		kaart.appendChild(el('h2', 'mmt-titel', w.titel || ''));
		alineas(w.tekst).forEach(function (a, i) {
			kaart.appendChild(el('p', i === 0 ? 'mmt-lead' : 'mmt-tekst', a));
		});
	}

	function tekenMoment(kaart, m) {
		if (!m) { return; }
		// Label boven het moment, instelbaar via de admin. Leeg = niks tonen.
		var label = (content.moment_label == null) ? 'Moment' : String(content.moment_label).trim();
		if (label) {
			kaart.appendChild(el('p', 'mmt-moment-label', label + ' ' + (m.nav || '')));
		}
		kaart.appendChild(el('h2', 'mmt-titel', m.titel || ''));
		alineas(m.intro).forEach(function (a) {
			kaart.appendChild(el('p', 'mmt-tekst', a));
		});

		if (m.oefeningTitel || m.oefeningTekst) {
			var box = el('div', 'mmt-oefening');
			if (m.oefeningTitel) { box.appendChild(el('p', 'mmt-oefening-titel', m.oefeningTitel)); }
			alineas(m.oefeningTekst).forEach(function (a) {
				box.appendChild(el('p', 'mmt-oefening-tekst', a));
			});
			kaart.appendChild(box);
		}

		kaart.appendChild(el('p', 'mmt-vraag', m.vraag || ''));

		var ta = el('textarea', 'mmt-invoer');
		ta.rows = 4;
		ta.placeholder = m.placeholder || 'Schrijf hier wat er in je opkomt...';
		ta.value = antwoorden[m.id] || '';
		ta.addEventListener('input', function () {
			antwoorden[m.id] = ta.value;
			bewaarOpgeslagen();
		});
		kaart.appendChild(ta);

		// Inspreken (spraak-naar-tekst): alleen als het aanstaat en de browser het kan.
		var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
		if (cfg.inspreken && SR) {
			kaart.appendChild(tekenInspreken(SR, ta, m.id));
		}
	}

	function tekenInspreken(SR, ta, momentId) {
		var knop = el('button', 'mmt-mic', '🎙 Inspreken');
		knop.type = 'button';
		var actief = false;
		var herkenning = null;

		knop.addEventListener('click', function () {
			if (actief && herkenning) {
				try { herkenning.stop(); } catch (e) {}
				return;
			}
			herkenning = new SR();
			herkenning.lang = 'nl-NL';
			herkenning.continuous = true;
			herkenning.interimResults = false;
			herkenning.onresult = function (e) {
				var tekst = '';
				for (var i = e.resultIndex; i < e.results.length; i++) {
					tekst += e.results[i][0].transcript + ' ';
				}
				var huidige = antwoorden[momentId] || '';
				antwoorden[momentId] = (huidige ? huidige + ' ' : '') + tekst.trim();
				ta.value = antwoorden[momentId];
				bewaarOpgeslagen();
			};
			herkenning.onend = function () {
				actief = false;
				knop.textContent = '🎙 Inspreken';
				knop.classList.remove('opnemen');
			};
			herkenning.onerror = function () {
				actief = false;
				knop.textContent = '🎙 Inspreken';
				knop.classList.remove('opnemen');
			};
			try {
				herkenning.start();
				actief = true;
				knop.textContent = '◼ Stop met opnemen';
				knop.classList.add('opnemen');
			} catch (e) {}
		});
		return knop;
	}

	function tekenBewaar(kaart) {
		var b = content.bewaar || {};
		kaart.appendChild(el('h2', 'mmt-titel', b.titel || ''));
		alineas(b.tekst).forEach(function (a) {
			kaart.appendChild(el('p', 'mmt-tekst', a));
		});

		// Overzicht van wat is ingevuld.
		var overzicht = el('div', 'mmt-overzicht');
		momenten.forEach(function (m) {
			var rij = el('div', 'mmt-overzicht-rij');
			rij.appendChild(el('p', 'mmt-overzicht-label', 'Moment ' + (m.nav || '')));
			var tekst = (antwoorden[m.id] || '').trim();
			rij.appendChild(el('p', 'mmt-overzicht-tekst', tekst ? (tekst.length > 80 ? tekst.slice(0, 80) + '…' : tekst) : 'Niet ingevuld'));
			overzicht.appendChild(rij);
		});
		kaart.appendChild(overzicht);

		// Honeypot (onzichtbaar veld tegen bots).
		var honeypot = el('input', 'mmt-hp');
		honeypot.type = 'text';
		honeypot.name = 'website';
		honeypot.tabIndex = -1;
		honeypot.setAttribute('autocomplete', 'off');
		honeypot.setAttribute('aria-hidden', 'true');
		kaart.appendChild(honeypot);

		var naam = el('input', 'mmt-invoer');
		naam.type = 'text';
		naam.placeholder = 'Jouw voornaam (optioneel)';
		naam.value = antwoorden.__naam || '';
		naam.addEventListener('input', function () { antwoorden.__naam = naam.value; bewaarOpgeslagen(); });
		kaart.appendChild(naam);

		var email = el('input', 'mmt-invoer');
		email.type = 'email';
		email.placeholder = 'jouw@email.nl';
		email.value = antwoorden.__email || '';
		kaart.appendChild(email);

		var bevestigd = false;
		var hint = el('p', 'mmt-hint', b.bevestigTekst || '');
		kaart.appendChild(hint);

		var fout = el('p', 'mmt-fout');
		fout.style.display = 'none';
		kaart.appendChild(fout);

		email.addEventListener('input', function () {
			antwoorden.__email = email.value;
			bewaarOpgeslagen();
			bevestigd = false;
			hint.classList.remove('bevestig');
			knop.textContent = b.knop || 'Stuur mij mijn brief';
		});

		var knop = el('button', 'mmt-knop', b.knop || 'Stuur mij mijn brief');
		knop.type = 'button';
		knop.addEventListener('click', function () {
			var adres = (email.value || '').trim();
			if (!adres || adres.indexOf('@') === -1) {
				toonFout(fout, 'Vul een geldig e-mailadres in.');
				return;
			}
			if (!bevestigd) {
				bevestigd = true;
				hint.classList.add('bevestig');
				knop.textContent = 'Ja, verstuur naar dit adres';
				return;
			}
			verstuur(honeypot.value, naam.value, adres, knop, fout);
		});
		kaart.appendChild(knop);

		if (b.privacyTekst) {
			kaart.appendChild(el('p', 'mmt-privacy', b.privacyTekst));
		}
	}

	function tekenAfrond(kaart) {
		var a = content.afrond || {};
		kaart.appendChild(el('h2', 'mmt-titel', a.titel || 'Dank je wel'));
		alineas(a.tekst).forEach(function (p) {
			kaart.appendChild(el('p', 'mmt-tekst', p));
		});
	}

	function toonFout(elmnt, tekst) {
		elmnt.textContent = tekst;
		elmnt.style.display = 'block';
	}

	function verstuur(honeypot, naam, email, knop, fout) {
		if (verzendBezig) { return; }
		verzendBezig = true;
		knop.disabled = true;
		knop.textContent = 'Bezig…';
		fout.style.display = 'none';

		var body = {
			website: honeypot,
			naam: naam,
			email: email,
			antwoorden: {}
		};
		momenten.forEach(function (m) {
			body.antwoorden[m.id] = antwoorden[m.id] || '';
		});

		fetch(cfg.restUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': cfg.nonce || ''
			},
			body: JSON.stringify(body)
		}).then(function (res) {
			return res.json().then(function (data) { return { status: res.status, data: data }; });
		}).then(function (r) {
			verzendBezig = false;
			if (r.data && r.data.ok) {
				wisOpgeslagen();
				stappen = stappen.concat(['afrond']);
				huidig = stappen.length - 1;
				teken();
				return;
			}
			knop.disabled = false;
			knop.textContent = 'Ja, verstuur naar dit adres';
			var fouten = {
				al_verstuurd: 'Je hebt op dit e-mailadres al eerder een brief ontvangen.',
				te_vaak: 'Het lukt even niet. Probeer het over een uurtje opnieuw.',
				ongeldig_email: 'Dit e-mailadres lijkt niet te kloppen.',
				leeg: 'Schrijf eerst bij een van de momenten iets op.'
			};
			toonFout(fout, fouten[r.data && r.data.fout] || 'Er ging iets mis. Probeer het opnieuw.');
		}).catch(function () {
			verzendBezig = false;
			knop.disabled = false;
			knop.textContent = 'Ja, verstuur naar dit adres';
			toonFout(fout, 'Er ging iets mis. Probeer het opnieuw.');
		});
	}

	function tekenNavigatie() {
		var wrap = el('div', 'mmt-nav');

		var vorige = el('button', 'mmt-nav-knop', '← Vorige');
		vorige.type = 'button';
		vorige.disabled = huidig === 0;
		vorige.addEventListener('click', function () { if (huidig > 0) { huidig--; teken(); } });
		wrap.appendChild(vorige);

		wrap.appendChild(el('span', 'mmt-nav-teller', (huidig + 1) + ' / ' + stappen.filter(function (s) { return s !== 'afrond'; }).length));

		var isLaatsteVoorBewaar = stappen[huidig] === 'bewaar';
		var volgende = el('button', 'mmt-nav-knop', 'Volgende →');
		volgende.type = 'button';
		volgende.style.visibility = isLaatsteVoorBewaar ? 'hidden' : 'visible';
		volgende.addEventListener('click', function () {
			if (huidig < stappen.length - 1) { huidig++; teken(); }
		});
		wrap.appendChild(volgende);

		return wrap;
	}
})();
