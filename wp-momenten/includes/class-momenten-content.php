<?php
/**
 * Teksten en instellingen: standaardwaarden, ophalen en veilig opslaan.
 * Alles staat in wp_options (twee opties: momenten_content en momenten_settings).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Momenten_Content {

	const OPT_CONTENT  = 'momenten_content';
	const OPT_SETTINGS = 'momenten_settings';

	/** Standaardteksten (warme basis, door de eigenaar aan te passen). */
	public static function defaults() {
		return array(
			'moment_label' => 'Vraag', // label boven elk moment; leeg = niks tonen.
			'welkom' => array(
				'titel' => 'Welkom, fijn dat je er bent!',
				'tekst' => "Wat mooi dat je even tijd maakt voor jezelf en jouw energie. We zijn vaak druk met alles om ons heen, terwijl we onze eigen batterij vaak vergeten echte aandacht te geven.\n\nMet deze vijf korte vragen sta je stil bij wat jou energie kost en wat je juist oplaadt. Je hoeft niets uit te zoeken of het perfecte antwoord te geven. Kies gewoon wat je herkent. Je mag meerdere antwoorden aanvinken en er is ruimte voor jouw eigen woorden.\n\nIk gebruik je antwoorden om een persoonlijke energiebrief voor je te schrijven. Een moment van aandacht voor jou, met inzichten en een kleine stap om uit te proberen.\n\nPak er gerust iets te drinken bij. Fijn dat je aanschuift.\n\nLiefs, Lies",
			),
			'momenten' => array(
				array(
					'id'         => 'm1',
					'nav'        => '1',
					'titel'      => 'Wanneer merk je dat je batterij leegloopt?',
					'vraag'      => 'Kies wat je herkent (meerdere mogelijk).',
					'type'       => 'keuze',
					'meerkeuze'  => 1,
					'anders'     => 1,
					'opties'     => array(
						'Na een dag met veel mensen of afspraken',
						'Als ik veel keuzes moet maken',
						'Wanneer anderen veel van me verwachten',
						'Als ik te weinig tijd voor mezelf heb',
						'Ik weet het eigenlijk niet goed',
					),
				),
				array(
					'id'         => 'm2',
					'nav'        => '2',
					'titel'      => 'Wat kost je regelmatig energie?',
					'vraag'      => 'Kies wat je herkent (meerdere mogelijk).',
					'type'       => 'keuze',
					'meerkeuze'  => 1,
					'anders'     => 1,
					'opties'     => array(
						'Me aanpassen aan anderen',
						"Vaak 'ja' zeggen terwijl ik 'nee' voel",
						'Steeds bereikbaar of beschikbaar zijn',
						'Twijfelen of ik het wel goed doe',
						'Te veel tegelijk willen of moeten',
					),
				),
				array(
					'id'         => 'm3',
					'nav'        => '3',
					'titel'      => 'Wanneer voel je je juist opgeladen of meer jezelf?',
					'vraag'      => 'Kies wat je herkent (meerdere mogelijk).',
					'type'       => 'keuze',
					'meerkeuze'  => 1,
					'anders'     => 1,
					'opties'     => array(
						'Als ik even alleen ben',
						'Bij mensen bij wie ik mezelf kan zijn',
						'Als ik beweeg of buiten ben',
						'Wanneer ik iets maak of doe waar ik plezier in heb',
						'Als ik rust heb en niets hoef',
					),
				),
				array(
					'id'         => 'm4',
					'nav'        => '4',
					'titel'      => 'Waaraan merk je dat je batterij bijna leeg is?',
					'vraag'      => 'Kies wat je herkent (meerdere mogelijk).',
					'type'       => 'keuze',
					'meerkeuze'  => 1,
					'anders'     => 1,
					'opties'     => array(
						'Ik word sneller prikkelbaar',
						'Ik kan me moeilijk concentreren',
						'Ik trek me terug',
						'Ik blijf doorgaan, maar voel weinig plezier',
						'Ik voel het pas als ik echt niet meer kan',
					),
				),
				array(
					'id'         => 'm5',
					'nav'        => '5',
					'titel'      => 'Wat zou je het liefst beter willen begrijpen?',
					'vraag'      => 'Kies wat je herkent (meerdere mogelijk).',
					'type'       => 'keuze',
					'meerkeuze'  => 1,
					'anders'     => 1,
					'opties'     => array(
						'Waarom ik zo vaak moe ben',
						'Wat mij ongemerkt energie kost',
						'Wat mij écht helpt opladen',
						'Waarom iets voor een ander werkt, maar voor mij niet',
						'Hoe ik beter naar mijn eigen grenzen kan luisteren',
					),
				),
				array(
					'id'          => 'm6',
					'nav'         => '6',
					'titel'       => 'Is er iets wat je graag wilt dat ik weet?',
					'intro'       => 'Dit veld is vrijwillig.',
					'vraag'       => 'Jouw eigen woorden',
					'type'        => 'open',
					'placeholder' => 'Schrijf hier wat je wil delen...',
				),
			),
			'bewaar' => array(
				'titel'         => 'Waar mag ik jouw energiebrief naartoe sturen?',
				'tekst'         => 'Laat je voornaam en e-mailadres achter, dan schrijf ik je een persoonlijke energiebrief.',
				'knop'          => 'Stuur mij mijn energiebrief',
				'bevestigTekst' => 'Klopt je e-mailadres? Dan komt je brief zeker aan.',
				'privacyTekst'  => 'Je antwoorden blijven van jou. Ik gebruik ze alleen voor jouw brief.',
			),
			'afrond' => array(
				'titel' => 'Dank je wel',
				'tekst' => "Ik heb je antwoorden ontvangen.\n\nJe ontvangt binnenkort je persoonlijke energiebrief in je inbox. Kijk dan ook even bij je ongewenste mail, voor het geval hij daar belandt.",
			),
		);
	}

	/** Standaardinstellingen. */
	public static function default_settings() {
		return array(
			'mailerlite_api_key'  => '',
			'mailerlite_group_id' => '',
			'notificatie_email'   => get_option( 'admin_email' ),
			'afzender_naam'       => get_option( 'blogname' ),
			'afzender_email'      => get_option( 'admin_email' ),
			'bewaartermijn_dagen' => 0, // 0 = onbeperkt bewaren.
			'accent_kleur'        => '#6d84a8',
			'tekst_kleur'         => '#3d3530',
			'achtergrond_kleur'   => '#fdf9f4',
			'kaart_kleur'         => '#ffffff',   // achtergrond van het tekstkader.
			'inspreken_aan'       => 1,           // 1 = inspreekknop tonen.
			'achtergrond_transparant' => 0,   // 1 = achtergrond van de website gebruiken.
			'rand_aan'            => 0,        // 1 = omkadering tonen.
			'rand_kleur'          => '#6d84a8',
			'hoek_afronding'      => 20,       // px, afronding van de hoeken.
			'lettertype'          => 'default', // default = lettertype van de website.
			'logo_url'            => '',
			'logo_grootte'        => 120,      // hoogte van het logo in px.
			'logo_uitsteken'      => 0,        // 1 = logo mag buiten de rand uitsteken.
			// Pop-up bij scrollen.
			'popup_aan'           => 0,
			'popup_scroll'        => 40,       // bij welk scroll-percentage hij verschijnt.
			'popup_afbeelding'    => '',
			'popup_titel'         => 'Even stilstaan?',
			'popup_tekst'         => 'Neem een paar minuten voor jezelf. We lopen samen langs een paar momenten, en je ontvangt een persoonlijke brief.',
			'popup_knop'          => 'Ja, ik neem even de tijd',
			'popup_knop_link'     => '',      // leeg = gids opent in de pop-up; een URL = knop linkt naar die pagina.
			'popup_animatie'      => 'fade',  // fade = infaden, pop = in het midden opkomen.
			'popup_fit'           => 'cover', // cover = vullend/bijsnijden, contain = passend/volledig.
			'popup_herhaal_dagen' => 7,       // aantal dagen niet opnieuw tonen; 0 = elke keer.
		);
	}

	/** Zet de standaardteksten klaar als er nog niets is opgeslagen (bij activeren). */
	public static function zet_defaults_indien_leeg() {
		if ( false === get_option( self::OPT_CONTENT, false ) ) {
			update_option( self::OPT_CONTENT, self::defaults() );
		}
		if ( false === get_option( self::OPT_SETTINGS, false ) ) {
			update_option( self::OPT_SETTINGS, self::default_settings() );
		}
	}

	/** Content ophalen, samengevoegd met de defaults zodat er nooit een veld ontbreekt. */
	public static function get_content() {
		$opgeslagen = get_option( self::OPT_CONTENT, array() );
		$defaults   = self::defaults();
		if ( ! is_array( $opgeslagen ) ) {
			return $defaults;
		}
		$c = wp_parse_args( $opgeslagen, $defaults );
		// Momenten volledig overnemen als ze bestaan, anders de defaults.
		if ( empty( $opgeslagen['momenten'] ) || ! is_array( $opgeslagen['momenten'] ) ) {
			$c['momenten'] = $defaults['momenten'];
		}
		return $c;
	}

	/** Instellingen ophalen, samengevoegd met de defaults. */
	public static function get_settings() {
		$opgeslagen = get_option( self::OPT_SETTINGS, array() );
		if ( ! is_array( $opgeslagen ) ) {
			return self::default_settings();
		}
		return wp_parse_args( $opgeslagen, self::default_settings() );
	}
}
