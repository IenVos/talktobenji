<?php
/**
 * Opslag van inzendingen in een eigen tabel.
 * Alle queries via $wpdb->prepare, dus geen ruimte voor SQL-injectie.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Momenten_DB {

	/** Naam van de tabel (met prefix van deze site). */
	public static function tabel() {
		global $wpdb;
		return $wpdb->prefix . 'momenten_inzendingen';
	}

	/** Tabel aanmaken/bijwerken (bij activeren). */
	public static function maak_tabel() {
		global $wpdb;
		$tabel           = self::tabel();
		$charset_collate = $wpdb->get_charset_collate();

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		$sql = "CREATE TABLE {$tabel} (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			aangemaakt DATETIME NOT NULL,
			email VARCHAR(190) NOT NULL,
			naam VARCHAR(190) DEFAULT '',
			antwoorden LONGTEXT NOT NULL,
			status VARCHAR(20) NOT NULL DEFAULT 'nieuw',
			brief LONGTEXT DEFAULT '',
			verzonden DATETIME DEFAULT NULL,
			ip_hash CHAR(64) DEFAULT '',
			PRIMARY KEY  (id),
			KEY email (email),
			KEY status (status),
			KEY aangemaakt (aangemaakt)
		) {$charset_collate};";
		dbDelta( $sql );
	}

	/**
	 * Nieuwe inzending opslaan.
	 *
	 * @param array $data email, naam, antwoorden (array), ip_hash.
	 * @return int|false Nieuw id of false.
	 */
	public static function voeg_toe( $data ) {
		global $wpdb;
		$ok = $wpdb->insert(
			self::tabel(),
			array(
				'aangemaakt' => current_time( 'mysql' ),
				'email'      => $data['email'],
				'naam'       => isset( $data['naam'] ) ? $data['naam'] : '',
				'antwoorden' => wp_json_encode( $data['antwoorden'] ),
				'status'     => 'nieuw',
				'ip_hash'    => isset( $data['ip_hash'] ) ? $data['ip_hash'] : '',
			),
			array( '%s', '%s', '%s', '%s', '%s', '%s' )
		);
		return $ok ? (int) $wpdb->insert_id : false;
	}

	/** Eén inzending ophalen. */
	public static function get( $id ) {
		global $wpdb;
		$id = (int) $id;
		return $wpdb->get_row(
			$wpdb->prepare( 'SELECT * FROM ' . self::tabel() . ' WHERE id = %d', $id )
		);
	}

	/** Lijst van inzendingen (nieuwste eerst). */
	public static function lijst( $limiet = 200 ) {
		global $wpdb;
		$limiet = (int) $limiet;
		return $wpdb->get_results(
			$wpdb->prepare( 'SELECT * FROM ' . self::tabel() . ' ORDER BY aangemaakt DESC LIMIT %d', $limiet )
		);
	}

	/** Aantal inzendingen met een bepaalde status. */
	public static function aantal( $status = '' ) {
		global $wpdb;
		if ( $status ) {
			return (int) $wpdb->get_var(
				$wpdb->prepare( 'SELECT COUNT(*) FROM ' . self::tabel() . ' WHERE status = %s', $status )
			);
		}
		return (int) $wpdb->get_var( 'SELECT COUNT(*) FROM ' . self::tabel() );
	}

	/** Heeft dit e-mailadres al eerder ingezonden? (tegen dubbele brieven). */
	public static function bestaat_email( $email ) {
		global $wpdb;
		return (bool) $wpdb->get_var(
			$wpdb->prepare( 'SELECT COUNT(*) FROM ' . self::tabel() . ' WHERE email = %s', $email )
		);
	}

	/** Markeer als verzonden en bewaar de brieftekst. */
	public static function markeer_verzonden( $id, $brief ) {
		global $wpdb;
		return $wpdb->update(
			self::tabel(),
			array(
				'status'    => 'verzonden',
				'brief'     => $brief,
				'verzonden' => current_time( 'mysql' ),
			),
			array( 'id' => (int) $id ),
			array( '%s', '%s', '%s' ),
			array( '%d' )
		);
	}

	/** Inzending verwijderen. */
	public static function verwijder( $id ) {
		global $wpdb;
		return $wpdb->delete( self::tabel(), array( 'id' => (int) $id ), array( '%d' ) );
	}

	/** Oude inzendingen opschonen volgens de bewaartermijn (0 = niet opschonen). */
	public static function schoon_oude_inzendingen_op() {
		global $wpdb;
		$settings = Momenten_Content::get_settings();
		$dagen    = (int) $settings['bewaartermijn_dagen'];
		if ( $dagen <= 0 ) {
			return;
		}
		$grens = gmdate( 'Y-m-d H:i:s', time() - $dagen * DAY_IN_SECONDS );
		$wpdb->query(
			$wpdb->prepare( 'DELETE FROM ' . self::tabel() . ' WHERE aangemaakt < %s', $grens )
		);
	}

	/** Hoeveel inzendingen deed dit ip-adres het laatste uur? (spamrem). */
	public static function aantal_recent_van_ip( $ip_hash, $seconden = 3600 ) {
		global $wpdb;
		$grens = gmdate( 'Y-m-d H:i:s', time() - (int) $seconden );
		return (int) $wpdb->get_var(
			$wpdb->prepare(
				'SELECT COUNT(*) FROM ' . self::tabel() . ' WHERE ip_hash = %s AND aangemaakt > %s',
				$ip_hash,
				$grens
			)
		);
	}
}
