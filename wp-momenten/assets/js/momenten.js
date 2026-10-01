/**
 * Momenten - frontend flow.
 * Vanilla JavaScript, geen externe bibliotheken.
 * Rendert de begeleide gids op de pagina (shortcode [momenten]) en/of in een
 * pop-up die bij het scrollen verschijnt. Inzendingen gaan naar het REST-eindpunt.
 */
(function () {
	'use strict';

	var cfg = window.MOMENTEN_CONFIG;
	if (!cfg) { return; }

	var content = cfg.content || {};
	var momenten = Array.isArray(content.momenten) ? content.momenten : [];
	var OPSLAG = 'mmt-antwoorden';
	var POPUP_DISMISS = 'mmt-popup-weg';

	/* ---------- gedeelde helpers ---------- */

	function el(tag, klasse, tekst) {
		var e = document.createElement(tag);
		if (klasse) { e.className = klasse; }
		if (tekst != null) { e.textContent = tekst; }
		return e;
	}

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

	function laadOpgeslagen() {
		try {
			var raw = window.localStorage.getItem(OPSLAG);
			return raw ? JSON.parse(raw) : {};
		} catch (e) {
			return {};
		}
	}
	function wisOpgeslagen() {
		try { window.localStorage.removeItem(OPSLAG); } catch (e) {}
	}

	// Klein "Powered by"-element (of null als het uitstaat).
	function maakBranding() {
		if (!cfg.branding || !cfg.branding.tekst) { return null; }
		var merk = el('div', 'mmt-branding');
		var a = el('a', null, cfg.branding.tekst);
		a.href = cfg.branding.url || '#';
		a.target = '_blank';
		a.rel = 'noopener';
		merk.appendChild(a);
		return merk;
	}

	// Zet de kleuren, het lettertype, de hoekafronding en de logo-grootte op een element.
	function pasThemaToe(elm) {
		if (cfg.kleuren) {
			elm.style.setProperty('--mmt-accent', cfg.kleuren.accent);
			elm.style.setProperty('--mmt-tekst', cfg.kleuren.tekst);
			elm.style.setProperty('--mmt-bg', cfg.kleuren.achtergrond);
			if (cfg.kleuren.kaart) { elm.style.setProperty('--mmt-kaart-bg', cfg.kleuren.kaart); }
		}
		if (cfg.radius !== undefined && cfg.radius !== '' && cfg.radius !== null) {
			elm.style.setProperty('--mmt-radius', parseInt(cfg.radius, 10) + 'px');
		}
		if (cfg.fontStack) { elm.style.fontFamily = cfg.fontStack; }
		if (cfg.logoGrootte) { elm.style.setProperty('--mmt-logo-h', parseInt(cfg.logoGrootte, 10) + 'px'); }
	}

	/* ---------- de gids (herbruikbaar in een container) ---------- */

	function maakGids(root) {
		var antwoorden = laadOpgeslagen();
		var stappen = ['welkom'].concat(momenten.map(function (m) { return m.id; })).concat(['bewaar']);
		var huidig = 0;
		var verzendBezig = false;

		function bewaarOpgeslagen() {
			try { window.localStorage.setItem(OPSLAG, JSON.stringify(antwoorden)); } catch (e) {}
		}

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

			if (m.vraag) { kaart.appendChild(el('p', 'mmt-vraag', m.vraag)); }

			if (m.type === 'keuze') {
				tekenKeuze(kaart, m);
				return;
			}

			var ta = el('textarea', 'mmt-invoer');
			ta.rows = 4;
			ta.placeholder = m.placeholder || 'Schrijf hier wat er in je opkomt...';
			ta.value = antwoorden[m.id] || '';
			ta.addEventListener('input', function () {
				antwoorden[m.id] = ta.value;
				bewaarOpgeslagen();
			});
			kaart.appendChild(ta);

			var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
			if (cfg.inspreken && SR) {
				kaart.appendChild(tekenInspreken(SR, ta, m.id));
			}
		}

		function tekenKeuze(kaart, m) {
			var opties = Array.isArray(m.opties) ? m.opties : [];
			var sel = Array.isArray(antwoorden[m.id + '__sel']) ? antwoorden[m.id + '__sel'].slice() : [];
			var meer = !!m.meerkeuze;

			var lijst = el('div', 'mmt-opties');
			var andersInput = null;

			opties.forEach(function (optie) {
				var rij = el('label', 'mmt-optie');
				var inp = document.createElement('input');
				inp.type = meer ? 'checkbox' : 'radio';
				inp.name = 'mmt-' + m.id;
				inp.value = optie;
				inp.checked = sel.indexOf(optie) !== -1;
				inp.addEventListener('change', function () { updateKeuze(m, lijst, andersInput); });
				rij.appendChild(inp);
				rij.appendChild(el('span', 'mmt-optie-tekst', optie));
				lijst.appendChild(rij);
			});
			kaart.appendChild(lijst);

			if (m.anders) {
				andersInput = document.createElement('input');
				andersInput.type = 'text';
				andersInput.className = 'mmt-invoer mmt-anders';
				andersInput.placeholder = 'Anders, namelijk...';
				andersInput.value = antwoorden[m.id + '__anders'] || '';
				andersInput.addEventListener('input', function () { updateKeuze(m, lijst, andersInput); });
				kaart.appendChild(andersInput);
			}
		}

		function updateKeuze(m, lijst, andersInput) {
			var gekozen = [];
			var inputs = lijst.querySelectorAll('input');
			for (var i = 0; i < inputs.length; i++) {
				if (inputs[i].checked) { gekozen.push(inputs[i].value); }
			}
			var andersText = andersInput ? andersInput.value.trim() : '';
			antwoorden[m.id + '__sel'] = gekozen;
			antwoorden[m.id + '__anders'] = andersText;
			var delen = gekozen.slice();
			if (andersText) { delen.push('Anders: ' + andersText); }
			antwoorden[m.id] = delen.join(', ');
			bewaarOpgeslagen();
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

			var overzicht = el('div', 'mmt-overzicht');
			momenten.forEach(function (m) {
				var rij = el('div', 'mmt-overzicht-rij');
				rij.appendChild(el('p', 'mmt-overzicht-label', 'Moment ' + (m.nav || '')));
				var tekst = (antwoorden[m.id] || '').trim();
				rij.appendChild(el('p', 'mmt-overzicht-tekst', tekst ? (tekst.length > 80 ? tekst.slice(0, 80) + '…' : tekst) : 'Niet ingevuld'));
				overzicht.appendChild(rij);
			});
			kaart.appendChild(overzicht);

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

			var body = { website: honeypot, naam: naam, email: email, antwoorden: {} };
			momenten.forEach(function (m) { body.antwoorden[m.id] = antwoorden[m.id] || ''; });

			fetch(cfg.restUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': cfg.nonce || '' },
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

		teken();
	}

	/* ---------- inline (shortcode) ---------- */

	var inlineRoot = document.querySelector('[data-momenten-root]');
	if (inlineRoot) {
		pasThemaToe(inlineRoot);
		if (cfg.transparant) { inlineRoot.style.background = 'transparent'; }
		if (cfg.rand) { inlineRoot.style.border = '2px solid ' + cfg.randKleur; }
		maakGids(inlineRoot);
		// "Powered by" onder het kader (buiten de rand).
		var inlineMerk = maakBranding();
		if (inlineMerk && inlineRoot.parentNode) {
			inlineRoot.parentNode.insertBefore(inlineMerk, inlineRoot.nextSibling);
		}
	}

	/* ---------- pop-up ---------- */

	if (cfg.popup && cfg.popup.aan) {
		zetPopupKlaar();
	}

	function popupLaatstWeg() {
		try {
			var t = parseInt(window.localStorage.getItem(POPUP_DISMISS), 10);
			return isNaN(t) ? 0 : t;
		} catch (e) { return 0; }
	}
	function popupOnthoudWeg() {
		try { window.localStorage.setItem(POPUP_DISMISS, String(Date.now())); } catch (e) {}
	}

	// Zorgt dat de pop-up er hetzelfde uitziet als de gids op de pagina.
	function stelAchtergrondIn(elm) {
		if (cfg.transparant) { elm.style.background = '#ffffff'; }
		if (cfg.rand) { elm.style.border = '2px solid ' + cfg.randKleur; }
	}

	function zetPopupKlaar() {
		var p = cfg.popup;
		var herhaalMs = Math.max(0, parseInt(p.herhaalDagen, 10) || 0) * 24 * 60 * 60 * 1000;
		if (herhaalMs > 0 && (Date.now() - popupLaatstWeg() < herhaalMs)) { return; }

		var isFade = (p.animatie !== 'pop'); // fade = kaartje rechtsonder, pop = midden.
		var getoond = false;
		var gidsGemaakt = false;

		function raf2(fn) { window.requestAnimationFrame(function () { window.requestAnimationFrame(fn); }); }
		function lockScroll(aan) { try { document.body.style.overflow = aan ? 'hidden' : ''; } catch (e) {} }
		function onthoud() { popupOnthoudWeg(); }

		function maakUitnodiging(compact) {
			var wrap = el('div', 'mmt-uitnodiging' + (compact ? ' compact' : ''));
			if (p.afbeelding) {
				var img = el('img', 'mmt-popup-img' + (p.fit === 'contain' ? ' passend' : ''));
				img.src = p.afbeelding;
				img.alt = '';
				img.style.objectFit = (p.fit === 'contain') ? 'contain' : 'cover';
				wrap.appendChild(img);
			}
			if (p.titel) { wrap.appendChild(el('h2', 'mmt-popup-titel', p.titel)); }
			alineas(p.tekst).forEach(function (a) { wrap.appendChild(el('p', 'mmt-popup-tekst', a)); });
			var start = el('button', 'mmt-knop', p.knop || 'Start');
			start.type = 'button';
			wrap.appendChild(start);
			var later = el('button', 'mmt-later', 'Nu even niet');
			later.type = 'button';
			wrap.appendChild(later);
			return { wrap: wrap, start: start, later: later };
		}

		// Modal in het midden (met daarin later de gids).
		var overlay = el('div', 'mmt-overlay animatie-' + (isFade ? 'fade' : 'pop'));
		overlay.setAttribute('role', 'dialog');
		overlay.setAttribute('aria-modal', 'true');
		overlay.hidden = true;
		var modal = el('div', 'mmt-root mmt-modal');
		pasThemaToe(modal);
		stelAchtergrondIn(modal);
		var sluitM = el('button', 'mmt-sluit', '×');
		sluitM.type = 'button';
		sluitM.setAttribute('aria-label', 'Sluiten');
		modal.appendChild(sluitM);
		var modalInvite = maakUitnodiging(false);
		modal.appendChild(modalInvite.wrap);
		var gidsHouder = el('div', 'mmt-gids-houder');
		gidsHouder.hidden = true;
		modal.appendChild(gidsHouder);
		// Geen "Powered by" in de pop-up; die staat alleen op de pagina zelf.
		overlay.appendChild(modal);

		// Kaartje rechtsonder (alleen bij infaden).
		var toast = null;
		if (isFade) {
			toast = el('div', 'mmt-root mmt-toast');
			pasThemaToe(toast);
			stelAchtergrondIn(toast);
			var sluitT = el('button', 'mmt-sluit', '×');
			sluitT.type = 'button';
			sluitT.setAttribute('aria-label', 'Sluiten');
			toast.appendChild(sluitT);
			var toastInvite = maakUitnodiging(true);
			toast.appendChild(toastInvite.wrap);
			sluitT.addEventListener('click', function () { verbergToast(); onthoud(); });
			toastInvite.start.addEventListener('click', openGids);
			toastInvite.later.addEventListener('click', function () { verbergToast(); onthoud(); });
		}

		sluitM.addEventListener('click', function () { verbergModal(); onthoud(); });
		modalInvite.start.addEventListener('click', openGids);
		modalInvite.later.addEventListener('click', function () { verbergModal(); onthoud(); });
		overlay.addEventListener('click', function (e) { if (e.target === overlay) { verbergModal(); onthoud(); } });
		document.addEventListener('keydown', function (e) {
			if (e.key !== 'Escape') { return; }
			if (overlay.parentNode) { verbergModal(); onthoud(); }
			else if (toast && toast.parentNode) { verbergToast(); onthoud(); }
		});

		function toonToast() {
			if (getoond) { return; }
			getoond = true;
			document.body.appendChild(toast);
			toast.hidden = false;
			raf2(function () { toast.classList.add('open'); });
		}
		function verbergToast() {
			if (!toast) { return; }
			toast.classList.remove('open');
			window.setTimeout(function () { if (toast.parentNode) { toast.parentNode.removeChild(toast); } }, 340);
		}
		function toonModalInvite() {
			if (getoond) { return; }
			getoond = true;
			document.body.appendChild(overlay);
			overlay.hidden = false;
			lockScroll(true);
			raf2(function () { overlay.classList.add('open'); });
		}
		function verbergModal() {
			overlay.classList.remove('open');
			lockScroll(false);
			window.setTimeout(function () { if (overlay.parentNode) { overlay.parentNode.removeChild(overlay); } }, 340);
		}
		function openGids() {
			if (isFade) { verbergToast(); }
			modalInvite.wrap.hidden = true;
			if (!overlay.parentNode) { document.body.appendChild(overlay); }
			overlay.hidden = false;
			lockScroll(true);
			raf2(function () { overlay.classList.add('open'); });
			gidsHouder.hidden = false;
			if (!gidsGemaakt) { maakGids(gidsHouder); gidsGemaakt = true; }
		}

		function toonUitnodiging() {
			if (isFade) { toonToast(); } else { toonModalInvite(); }
		}

		// Verschijnen op scroll-percentage.
		var drempel = Math.max(0, Math.min(100, parseInt(p.scroll, 10) || 0));
		function gescroldGenoeg() {
			var h = document.documentElement.scrollHeight - window.innerHeight;
			var pct = h > 0 ? (window.scrollY / h) * 100 : 100;
			return pct >= drempel;
		}
		function check() {
			if (getoond) { return; }
			if (gescroldGenoeg()) { toonUitnodiging(); window.removeEventListener('scroll', check); }
		}
		if (drempel <= 0) {
			window.setTimeout(toonUitnodiging, 700);
		} else {
			window.addEventListener('scroll', check, { passive: true });
			check();
		}
	}
})();
