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
			'welkom' => array(
				'titel' => 'Wat goed dat je hier bent',
				'tekst' => "Je bent hier omdat je iets draagt wat zwaar is.\n\nJe hoeft hier niets uit te leggen. In de komende momenten krijg je de ruimte om stil te staan bij wat er in je leeft.\n\nAan het einde ontvang je een persoonlijke brief, geschreven vanuit wat jij hebt gedeeld.",
			),
			'momenten' => array(
				array(
					'id'            => 'm1',
					'nav'           => '1',
					'titel'         => "Als je 's nachts wakker ligt",
					'intro'         => "Het is 3 uur. De rest van de wereld slaapt. Jij niet.\n\nDe stilte voelt te groot, en juist nu mis je hem of haar het meest. Dit is niet gek. 's Nachts is er geen afleiding, dan komt het gemis gewoon langs.",
					'oefeningTitel' => 'Wat je nu kunt doen',
					'oefeningTekst' => "Leg je hand op je borst. Voel je hartslag. Zeg zachtjes: \"Ik ben hier. Dit mag er zijn.\"\n\nNiet om het weg te maken, maar om jezelf even gezelschap te houden.",
					'vraag'         => 'Wat mis je op dit moment het meest?',
					'placeholder'   => 'Schrijf hier wat er in je opkomt...',
				),
				array(
					'id'            => 'm2',
					'nav'           => '2',
					'titel'         => 'Als je niet weet wat je voelt',
					'intro'         => "Verdoofd. Leeg. Of juist alles tegelijk.\n\nVerdriet ziet er niet altijd uit zoals je denkt. Soms voel je niks, en dat voelt ook weer verkeerd. Maar verdoofdheid is hoe je lichaam je even beschermt. Het klopt.",
					'oefeningTitel' => 'Wat je nu kunt doen',
					'oefeningTekst' => "Schrijf drie woorden op die ook maar een beetje in de buurt komen van wat je voelt.\n\nGeen zinnen, geen uitleg. Je hoeft het niet te begrijpen.",
					'vraag'         => 'Als je gevoel vandaag een kleur had, welke zou dat zijn?',
					'placeholder'   => 'Schrijf hier wat er in je opkomt...',
				),
				array(
					'id'            => 'm3',
					'nav'           => '3',
					'titel'         => 'Als iemand vraagt hoe het gaat en je het antwoord niet weet',
					'intro'         => "Je zegt \"gaat wel.\" En terwijl je het zegt, voel je hoe eenzaam dat is.\n\nHet echte antwoord is te groot voor een praatje tussendoor. Dus je verpakt het. Elke dag weer.",
					'oefeningTitel' => 'Wat je nu kunt doen',
					'oefeningTekst' => "Schrijf voor jezelf het antwoord op zoals je het echt zou willen geven.\n\nNiemand leest het. Het is alleen voor jou.",
					'vraag'         => 'Aan wie zou je het echte antwoord wel durven geven?',
					'placeholder'   => 'Schrijf hier wat er in je opkomt...',
				),
				array(
					'id'            => 'm4',
					'nav'           => '4',
					'titel'         => 'Als een geur of een liedje je overspoelt',
					'intro'         => "Zonder waarschuwing. Midden op de dag.\n\nEen nummer, de geur van een jas. Ineens is het er weer helemaal. Dit zijn geen zwakke momenten. Dit is liefde die je voelt.",
					'oefeningTitel' => 'Wat je nu kunt doen',
					'oefeningTekst' => "Laat het even komen. Leg je telefoon weg en geef het twee minuten.\n\nHuil als het komt, adem als het zakt.",
					'vraag'         => 'Welke herinnering komt nu naar boven?',
					'placeholder'   => 'Schrijf hier wat er in je opkomt...',
				),
				array(
					'id'            => 'm5',
					'nav'           => '5',
					'titel'         => 'Als je je schuldig voelt dat je even gelachen hebt',
					'intro'         => "Even niet aan het gemis gedacht. En dan dat steekje: hoe kan ik lachen terwijl...\n\nLachen betekent niet dat je loslaat. Het betekent dat je nog leeft.",
					'oefeningTitel' => 'Wat je nu kunt doen',
					'oefeningTekst' => "Schrijf een herinnering op die je blij maakt. Niet om het verdriet te vergeten, maar om het ernaast te laten bestaan.\n\nBlij en verdrietig tegelijk. Dat mag.",
					'vraag'         => 'Waar moest je om lachen, en waarom voelt dat goed en moeilijk tegelijk?',
					'placeholder'   => 'Schrijf hier wat er in je opkomt...',
				),
			),
			'bewaar' => array(
				'titel'         => 'Je woorden, terug naar jou',
				'tekst'         => 'Laat je e-mailadres achter, dan maken we van wat je hebt opgeschreven een persoonlijke brief en sturen we die naar je toe.',
				'knop'          => 'Stuur mij mijn brief',
				'bevestigTekst' => 'Klopt je e-mailadres? Dan komt je brief zeker aan.',
				'privacyTekst'  => 'Je woorden blijven van jou. We sturen alleen deze brief.',
			),
			'afrond' => array(
				'titel' => 'Dank je wel voor je woorden',
				'tekst' => "We hebben ontvangen wat je hebt opgeschreven.\n\nJe ontvangt binnenkort een persoonlijke brief in je inbox. Kijk dan ook even bij je ongewenste mail, voor het geval hij daar belandt.",
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
			'achtergrond_transparant' => 0,   // 1 = achtergrond van de website gebruiken.
			'rand_aan'            => 0,        // 1 = omkadering tonen.
			'rand_kleur'          => '#6d84a8',
			'hoek_afronding'      => 20,       // px, afronding van de hoeken.
			'lettertype'          => 'default', // default = lettertype van de website.
			'logo_url'            => '',
			'logo_uitsteken'      => 0,        // 1 = logo mag buiten de rand uitsteken.
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
