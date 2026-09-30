/**
 * Momenten - beheer. Momenten toevoegen, verwijderen en verplaatsen.
 * De volgorde in het scherm is de volgorde die wordt opgeslagen.
 */
(function () {
	'use strict';

	document.addEventListener('DOMContentLoaded', function () {
		var lijst = document.getElementById('momenten-lijst');
		var tmpl = document.getElementById('moment-template');
		var toevoegen = document.getElementById('moment-toevoegen');

		if (toevoegen && tmpl && lijst) {
			toevoegen.addEventListener('click', function () {
				var uniek = Date.now();
				var html = tmpl.innerHTML.replace(/__i__/g, String(uniek));
				var houder = document.createElement('div');
				houder.innerHTML = html.trim();
				var kaart = houder.firstElementChild;
				if (kaart) {
					lijst.appendChild(kaart);
					kaart.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}
			});
		}

		// Logo kiezen via de mediabibliotheek.
		var kiesLogo = document.getElementById('momenten-logo-kies');
		var verwijderLogo = document.getElementById('momenten-logo-verwijder');
		var logoVeld = document.getElementById('momenten_logo_url');
		var logoPreview = document.querySelector('.momenten-logo-preview');
		var mediaFrame = null;

		if (kiesLogo && logoVeld && window.wp && window.wp.media) {
			kiesLogo.addEventListener('click', function (e) {
				e.preventDefault();
				if (mediaFrame) { mediaFrame.open(); return; }
				mediaFrame = window.wp.media({
					title: 'Kies een logo',
					library: { type: 'image' },
					multiple: false,
					button: { text: 'Gebruiken' }
				});
				mediaFrame.on('select', function () {
					var att = mediaFrame.state().get('selection').first().toJSON();
					logoVeld.value = att.url;
					if (logoPreview) {
						logoPreview.innerHTML = '';
						var img = document.createElement('img');
						img.src = att.url;
						img.alt = '';
						logoPreview.appendChild(img);
					}
				});
				mediaFrame.open();
			});
		}
		if (verwijderLogo && logoVeld) {
			verwijderLogo.addEventListener('click', function (e) {
				e.preventDefault();
				logoVeld.value = '';
				if (logoPreview) { logoPreview.innerHTML = ''; }
			});
		}

		document.addEventListener('click', function (e) {
			var t = e.target;
			if (!t) { return; }
			var kaart = t.closest ? t.closest('.momenten-kaart') : null;

			if (t.classList.contains('moment-verwijder')) {
				e.preventDefault();
				if (kaart && window.confirm('Dit moment verwijderen?')) {
					kaart.parentNode.removeChild(kaart);
				}
			} else if (t.classList.contains('moment-omhoog')) {
				e.preventDefault();
				if (kaart && kaart.previousElementSibling) {
					kaart.parentNode.insertBefore(kaart, kaart.previousElementSibling);
				}
			} else if (t.classList.contains('moment-omlaag')) {
				e.preventDefault();
				if (kaart && kaart.nextElementSibling) {
					kaart.parentNode.insertBefore(kaart.nextElementSibling, kaart);
				}
			}
		});
	});
})();
