<?php
/**
 * Frontend: de shortcode [momenten] en het laden van de eigen stijl en het script.
 * Er wordt niets van buitenaf geladen; css en js komen uit deze plugin.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Momenten_Frontend {

	private $moet_laden = false;

	public function __construct() {
		add_shortcode( 'momenten', array( $this, 'shortcode' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'registreer_assets' ) );
		add_action( 'wp_footer', array( $this, 'laad_indien_nodig' ) );
	}

	public function registreer_assets() {
		wp_register_style( 'momenten', MOMENTEN_URL . 'assets/css/momenten.css', array(), MOMENTEN_VERSION );
		wp_register_script( 'momenten', MOMENTEN_URL . 'assets/js/momenten.js', array(), MOMENTEN_VERSION, true );
	}

	/** De shortcode plaatst alleen een houder; het script vult hem. */
	public function shortcode( $atts ) {
		$this->moet_laden = true;
		wp_enqueue_style( 'momenten' );
		wp_enqueue_script( 'momenten' );
		return '<div class="mmt-root" data-momenten-root></div><noscript><p>Zet JavaScript aan om deze gids te gebruiken.</p></noscript>';
	}

	/** Config pas in de footer meegeven, alleen als de shortcode op de pagina stond. */
	public function laad_indien_nodig() {
		if ( ! $this->moet_laden ) {
			return;
		}
		$content  = Momenten_Content::get_content();
		$settings  = Momenten_Content::get_settings();

		// Alleen wat de frontend nodig heeft. Geen sleutels of e-mailadressen.
		$config = array(
			'restUrl'  => esc_url_raw( rest_url( 'momenten/v1/submit' ) ),
			'nonce'    => wp_create_nonce( 'wp_rest' ),
			'logo'     => esc_url_raw( $settings['logo_url'] ),
			'kleuren'  => array(
				'accent'      => $this->veilige_kleur( $settings['accent_kleur'], '#6d84a8' ),
				'tekst'       => $this->veilige_kleur( $settings['tekst_kleur'], '#3d3530' ),
				'achtergrond' => $this->veilige_kleur( $settings['achtergrond_kleur'], '#fdf9f4' ),
			),
			'content'  => $content,
		);

		wp_localize_script( 'momenten', 'MOMENTEN_CONFIG', $config );
	}

	/** Alleen een geldige hexkleur doorlaten. */
	private function veilige_kleur( $waarde, $terugval ) {
		$waarde = sanitize_hex_color( $waarde );
		return $waarde ? $waarde : $terugval;
	}
}
