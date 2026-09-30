<?php
/**
 * Publiek eindpunt waar het formulier naartoe stuurt.
 * Beveiliging: honeypot, snelheidslimiet per ip, e-mailcontrole, dubbel-check,
 * en alle invoer wordt opgeschoond voor het wordt opgeslagen.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Momenten_Rest {

	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'registreer_routes' ) );
	}

	public function registreer_routes() {
		register_rest_route(
			'momenten/v1',
			'/submit',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'verwerk_inzending' ),
				'permission_callback' => '__return_true', // Publiek formulier; beveiliging hieronder.
			)
		);
	}

	/** Hash van het ip-adres (we bewaren nooit het echte adres). */
	private function ip_hash() {
		$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
		return hash_hmac( 'sha256', $ip, wp_salt( 'momenten' ) );
	}

	public function verwerk_inzending( WP_REST_Request $request ) {
		$params = $request->get_json_params();
		if ( ! is_array( $params ) ) {
			$params = $request->get_params();
		}

		// 1. Honeypot: is dit verborgen veld ingevuld, dan is het een bot.
		$honeypot = isset( $params['website'] ) ? trim( (string) $params['website'] ) : '';
		if ( '' !== $honeypot ) {
			// Doe alsof het gelukt is, zodat de bot niets leert.
			return new WP_REST_Response( array( 'ok' => true ), 200 );
		}

		// 2. E-mail controleren.
		$email = isset( $params['email'] ) ? sanitize_email( (string) $params['email'] ) : '';
		if ( '' === $email || ! is_email( $email ) ) {
			return new WP_REST_Response( array( 'ok' => false, 'fout' => 'ongeldig_email' ), 400 );
		}

		$ip_hash = $this->ip_hash();

		// 3. Snelheidslimiet: max 3 inzendingen per ip per uur.
		if ( Momenten_DB::aantal_recent_van_ip( $ip_hash, HOUR_IN_SECONDS ) >= 3 ) {
			return new WP_REST_Response( array( 'ok' => false, 'fout' => 'te_vaak' ), 429 );
		}

		// 4. Al eerder ingezonden met dit adres?
		if ( Momenten_DB::bestaat_email( $email ) ) {
			return new WP_REST_Response( array( 'ok' => false, 'fout' => 'al_verstuurd' ), 409 );
		}

		// 5. Naam en antwoorden opschonen.
		$naam    = isset( $params['naam'] ) ? sanitize_text_field( (string) $params['naam'] ) : '';
		$naam    = mb_substr( $naam, 0, 120 );
		$content = Momenten_Content::get_content();

		$antwoorden = array();
		$ruwe       = isset( $params['antwoorden'] ) && is_array( $params['antwoorden'] ) ? $params['antwoorden'] : array();
		foreach ( $content['momenten'] as $moment ) {
			$id       = $moment['id'];
			$waarde   = isset( $ruwe[ $id ] ) ? (string) $ruwe[ $id ] : '';
			$waarde   = sanitize_textarea_field( $waarde );
			$waarde   = mb_substr( $waarde, 0, 5000 ); // harde bovengrens.
			$antwoorden[] = array(
				'moment'   => $moment['nav'],
				'vraag'    => $moment['vraag'],
				'antwoord' => $waarde,
			);
		}

		// 6. Minstens iets ingevuld?
		$iets_ingevuld = false;
		foreach ( $antwoorden as $a ) {
			if ( '' !== trim( $a['antwoord'] ) ) {
				$iets_ingevuld = true;
				break;
			}
		}
		if ( ! $iets_ingevuld ) {
			return new WP_REST_Response( array( 'ok' => false, 'fout' => 'leeg' ), 400 );
		}

		// 7. Opslaan.
		$id = Momenten_DB::voeg_toe(
			array(
				'email'      => $email,
				'naam'       => $naam,
				'antwoorden' => $antwoorden,
				'ip_hash'    => $ip_hash,
			)
		);
		if ( ! $id ) {
			return new WP_REST_Response( array( 'ok' => false, 'fout' => 'opslaan' ), 500 );
		}

		// 8. MailerLite (mag falen zonder het formulier te breken).
		Momenten_MailerLite::voeg_abonnee_toe( $email, $naam );

		// 9. Melding naar de eigenaar.
		$this->stuur_melding( $id, $email, $naam );

		return new WP_REST_Response( array( 'ok' => true ), 200 );
	}

	/** Korte melding naar het ingestelde adres dat er een nieuwe inzending is. */
	private function stuur_melding( $id, $email, $naam ) {
		$settings = Momenten_Content::get_settings();
		$naar     = sanitize_email( $settings['notificatie_email'] );
		if ( '' === $naar || ! is_email( $naar ) ) {
			return;
		}
		$link    = admin_url( 'admin.php?page=momenten-inzendingen&bekijk=' . (int) $id );
		$onderwerp = 'Nieuwe inzending via Momenten';
		$regels  = array(
			'Er is een nieuwe inzending binnengekomen.',
			'',
			'Naam: ' . ( $naam ? $naam : '(niet ingevuld)' ),
			'E-mail: ' . $email,
			'',
			'Bekijk en schrijf de brief:',
			$link,
		);
		wp_mail( $naar, $onderwerp, implode( "\n", $regels ) );
	}
}
