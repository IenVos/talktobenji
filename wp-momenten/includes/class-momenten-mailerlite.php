<?php
/**
 * MailerLite-koppeling (nieuwe API, connect.mailerlite.com met Bearer-token).
 * De API-sleutel wordt server-side gebruikt en komt nooit in de frontend.
 * Faalt de koppeling, dan blijft de inzending gewoon opgeslagen; het formulier faalt niet.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Momenten_MailerLite {

	/**
	 * Voeg een abonnee toe aan de ingestelde groep.
	 *
	 * @param string $email E-mailadres.
	 * @param string $naam  Optionele voornaam.
	 * @return true|WP_Error
	 */
	public static function voeg_abonnee_toe( $email, $naam = '' ) {
		$settings = Momenten_Content::get_settings();
		$api_key  = trim( (string) $settings['mailerlite_api_key'] );
		$group_id = trim( (string) $settings['mailerlite_group_id'] );

		if ( '' === $api_key ) {
			return new WP_Error( 'geen_sleutel', 'Geen MailerLite-sleutel ingesteld.' );
		}

		$body = array( 'email' => $email );
		if ( '' !== $naam ) {
			$body['fields'] = array( 'name' => $naam );
		}
		if ( '' !== $group_id ) {
			$body['groups'] = array( $group_id );
		}

		$response = wp_remote_post(
			'https://connect.mailerlite.com/api/subscribers',
			array(
				'timeout' => 12,
				'headers' => array(
					'Authorization' => 'Bearer ' . $api_key,
					'Content-Type'  => 'application/json',
					'Accept'        => 'application/json',
				),
				'body'    => wp_json_encode( $body ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code = wp_remote_retrieve_response_code( $response );
		if ( $code >= 200 && $code < 300 ) {
			return true;
		}
		return new WP_Error( 'mailerlite_fout', 'MailerLite gaf status ' . $code, wp_remote_retrieve_body( $response ) );
	}

	/**
	 * Test de sleutel door de groepenlijst op te vragen.
	 *
	 * @param string $api_key
	 * @return true|WP_Error
	 */
	public static function test_sleutel( $api_key ) {
		$api_key = trim( (string) $api_key );
		if ( '' === $api_key ) {
			return new WP_Error( 'leeg', 'Geen sleutel opgegeven.' );
		}
		$response = wp_remote_get(
			'https://connect.mailerlite.com/api/groups?limit=1',
			array(
				'timeout' => 12,
				'headers' => array(
					'Authorization' => 'Bearer ' . $api_key,
					'Accept'        => 'application/json',
				),
			)
		);
		if ( is_wp_error( $response ) ) {
			return $response;
		}
		$code = wp_remote_retrieve_response_code( $response );
		if ( 200 === $code ) {
			return true;
		}
		return new WP_Error( 'ongeldig', 'De sleutel werkt niet (status ' . $code . ').' );
	}
}
