<?php
/**
 * Plugin Name:       Momenten
 * Description:        Een warme, begeleide mini-gids: de bezoeker staat stil bij een paar momenten, laat een e-mailadres achter en jij stuurt een persoonlijke brief terug. Zelf te beheren, MailerLite-koppeling, alles op je eigen site.
 * Version:           1.0.0
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            Talk To Benji
 * License:           GPL-2.0-or-later
 * Text Domain:       momenten
 *
 * Alle data (teksten, instellingen, inzendingen) blijft op deze WordPress-site.
 * Er draait niets op een externe server, en er wordt geen code van buitenaf geladen.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Directe toegang blokkeren.
}

define( 'MOMENTEN_VERSION', '1.0.0' );
define( 'MOMENTEN_FILE', __FILE__ );
define( 'MOMENTEN_DIR', plugin_dir_path( __FILE__ ) );
define( 'MOMENTEN_URL', plugin_dir_url( __FILE__ ) );

require_once MOMENTEN_DIR . 'includes/class-momenten-content.php';
require_once MOMENTEN_DIR . 'includes/class-momenten-db.php';
require_once MOMENTEN_DIR . 'includes/class-momenten-mailerlite.php';
require_once MOMENTEN_DIR . 'includes/class-momenten-rest.php';
require_once MOMENTEN_DIR . 'includes/class-momenten-frontend.php';
require_once MOMENTEN_DIR . 'includes/class-momenten-admin.php';

/**
 * Bij activeren: de inzendingen-tabel aanmaken en de standaardteksten klaarzetten.
 */
function momenten_activeer() {
	Momenten_DB::maak_tabel();
	Momenten_Content::zet_defaults_indien_leeg();
	// Cron voor het opschonen van oude inzendingen (bewaartermijn).
	if ( ! wp_next_scheduled( 'momenten_dagelijkse_schoonmaak' ) ) {
		wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', 'momenten_dagelijkse_schoonmaak' );
	}
}
register_activation_hook( __FILE__, 'momenten_activeer' );

/**
 * Bij deactiveren: de geplande schoonmaak stoppen. Data blijft staan.
 */
function momenten_deactiveer() {
	$timestamp = wp_next_scheduled( 'momenten_dagelijkse_schoonmaak' );
	if ( $timestamp ) {
		wp_unschedule_event( $timestamp, 'momenten_dagelijkse_schoonmaak' );
	}
}
register_deactivation_hook( __FILE__, 'momenten_deactiveer' );

// Dagelijkse schoonmaak van oude inzendingen volgens de bewaartermijn.
add_action( 'momenten_dagelijkse_schoonmaak', array( 'Momenten_DB', 'schoon_oude_inzendingen_op' ) );

/**
 * Onderdelen opstarten.
 */
function momenten_start() {
	load_plugin_textdomain( 'momenten', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
	new Momenten_Frontend();
	new Momenten_Rest();
	if ( is_admin() ) {
		new Momenten_Admin();
	}
}
add_action( 'plugins_loaded', 'momenten_start' );
