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

	/** Lettertype-opties: stack voor de css + eventueel een Google-font om te laden. */
	private function font_info( $key ) {
		$map = array(
			'default'  => array( 'stack' => '', 'google' => '' ),
			'serif'    => array( 'stack' => "Georgia, 'Times New Roman', serif", 'google' => '' ),
			'sans'     => array( 'stack' => "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", 'google' => '' ),
			'playfair' => array( 'stack' => "'Playfair Display', Georgia, serif", 'google' => 'Playfair+Display:ital,wght@0,400;0,600;1,400' ),
			'lora'     => array( 'stack' => "'Lora', Georgia, serif", 'google' => 'Lora:ital,wght@0,400;0,600;1,400' ),
			'poppins'  => array( 'stack' => "'Poppins', sans-serif", 'google' => 'Poppins:wght@400;500;600' ),
			'nunito'   => array( 'stack' => "'Nunito', sans-serif", 'google' => 'Nunito:wght@400;600;700' ),
		);
		return isset( $map[ $key ] ) ? $map[ $key ] : $map['default'];
	}

	/** De shortcode plaatst alleen een houder; het script vult hem. */
	public function shortcode( $atts ) {
		$this->moet_laden = true;
		wp_enqueue_style( 'momenten' );
		wp_enqueue_script( 'momenten' );

		// Google-font laden als er een gekozen is (anders het lettertype van de site).
		$settings = Momenten_Content::get_settings();
		$font     = $this->font_info( $settings['lettertype'] );
		if ( $font['google'] ) {
			wp_enqueue_style( 'momenten-font', 'https://fonts.googleapis.com/css2?family=' . $font['google'] . '&display=swap', array(), null );
		}

		return '<div class="mmt-root" data-momenten-root></div><noscript><p>Zet JavaScript aan om deze gids te gebruiken.</p></noscript>';
	}

	/** Config pas in de footer meegeven, alleen als de shortcode op de pagina stond. */
	public function laad_indien_nodig() {
		if ( ! $this->moet_laden ) {
			return;
		}
		$content  = Momenten_Content::get_content();
		$settings  = Momenten_Content::get_settings();
		$font     = $this->font_info( $settings['lettertype'] );

		// Alleen wat de frontend nodig heeft. Geen sleutels of e-mailadressen.
		$config = array(
			'restUrl'     => esc_url_raw( rest_url( 'momenten/v1/submit' ) ),
			'nonce'       => wp_create_nonce( 'wp_rest' ),
			'logo'        => esc_url_raw( $settings['logo_url'] ),
			'logoUitsteken' => ! empty( $settings['logo_uitsteken'] ),
			'transparant' => ! empty( $settings['achtergrond_transparant'] ),
			'rand'        => ! empty( $settings['rand_aan'] ),
			'randKleur'   => $this->veilige_kleur( $settings['rand_kleur'], '#6d84a8' ),
			'radius'      => (int) $settings['hoek_afronding'],
			'fontStack'   => $font['stack'],
			'inspreken'   => ! empty( $settings['inspreken_aan'] ),
			'kleuren'     => array(
				'accent'      => $this->veilige_kleur( $settings['accent_kleur'], '#6d84a8' ),
				'tekst'       => $this->veilige_kleur( $settings['tekst_kleur'], '#3d3530' ),
				'achtergrond' => $this->veilige_kleur( $settings['achtergrond_kleur'], '#fdf9f4' ),
				'kaart'       => $this->veilige_kleur( $settings['kaart_kleur'], '#ffffff' ),
			),
			'content'     => $content,
		);

		wp_localize_script( 'momenten', 'MOMENTEN_CONFIG', $config );
	}

	/** Alleen een geldige hexkleur doorlaten. */
	private function veilige_kleur( $waarde, $terugval ) {
		$waarde = sanitize_hex_color( $waarde );
		return $waarde ? $waarde : $terugval;
	}
}
