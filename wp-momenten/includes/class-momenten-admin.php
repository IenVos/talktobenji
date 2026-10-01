<?php
/**
 * Beheer: menu met Teksten, Instellingen en Inzendingen.
 * Elke opslag-actie is beveiligd met een nonce en een rechtencontrole,
 * en alle invoer wordt opgeschoond.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Momenten_Admin {

	const CAP = 'manage_options';

	public function __construct() {
		add_action( 'admin_menu', array( $this, 'menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'assets' ) );
		add_action( 'add_meta_boxes', array( $this, 'metabox_toevoegen' ) );
		add_action( 'save_post', array( $this, 'metabox_opslaan' ) );
	}

	/* ─── Pop-up per pagina aan/uit ─── */

	public function metabox_toevoegen() {
		foreach ( array( 'page', 'post' ) as $type ) {
			add_meta_box( 'momenten-popup', 'Momenten pop-up', array( $this, 'metabox_render' ), $type, 'side' );
		}
	}

	public function metabox_render( $post ) {
		wp_nonce_field( 'momenten_popup_meta', 'momenten_popup_nonce' );
		$waarde = get_post_meta( $post->ID, '_momenten_popup', true );
		$opties = array(
			''    => 'Standaard (volg de instelling)',
			'aan' => 'Altijd tonen op deze pagina',
			'uit' => 'Nooit tonen op deze pagina',
		);
		echo '<p style="margin-top:0">Toon de scroll-pop-up hier:</p>';
		foreach ( $opties as $key => $label ) {
			echo '<label style="display:block;margin:.35em 0"><input type="radio" name="momenten_popup" value="' . esc_attr( $key ) . '" ' . checked( $waarde, $key, false ) . '> ' . esc_html( $label ) . '</label>';
		}
	}

	public function metabox_opslaan( $post_id ) {
		if ( ! isset( $_POST['momenten_popup_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['momenten_popup_nonce'] ) ), 'momenten_popup_meta' ) ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		$waarde = isset( $_POST['momenten_popup'] ) ? sanitize_key( wp_unslash( $_POST['momenten_popup'] ) ) : '';
		if ( ! in_array( $waarde, array( 'aan', 'uit' ), true ) ) {
			delete_post_meta( $post_id, '_momenten_popup' );
		} else {
			update_post_meta( $post_id, '_momenten_popup', $waarde );
		}
	}

	public function menu() {
		add_menu_page( 'Momenten', 'Momenten', self::CAP, 'momenten-teksten', array( $this, 'pagina_teksten' ), 'dashicons-feedback', 30 );
		add_submenu_page( 'momenten-teksten', 'Teksten', 'Teksten', self::CAP, 'momenten-teksten', array( $this, 'pagina_teksten' ) );
		add_submenu_page( 'momenten-teksten', 'Instellingen', 'Instellingen', self::CAP, 'momenten-instellingen', array( $this, 'pagina_instellingen' ) );
		$aantal_nieuw = Momenten_DB::aantal( 'nieuw' );
		$badge        = $aantal_nieuw ? ' <span class="update-plugins count-' . $aantal_nieuw . '"><span class="update-count">' . $aantal_nieuw . '</span></span>' : '';
		add_submenu_page( 'momenten-teksten', 'Inzendingen', 'Inzendingen' . $badge, self::CAP, 'momenten-inzendingen', array( $this, 'pagina_inzendingen' ) );
	}

	public function assets( $hook ) {
		if ( false === strpos( $hook, 'momenten' ) ) {
			return;
		}
		// Media-bibliotheek voor het kiezen van een logo.
		wp_enqueue_media();
		wp_enqueue_style( 'momenten-admin', MOMENTEN_URL . 'assets/css/admin.css', array(), MOMENTEN_VERSION );
		wp_enqueue_script( 'momenten-admin', MOMENTEN_URL . 'assets/js/admin.js', array(), MOMENTEN_VERSION, true );
	}

	/* ─────────────────────────── Teksten ─────────────────────────── */

	public function pagina_teksten() {
		if ( ! current_user_can( self::CAP ) ) {
			return;
		}

		if ( isset( $_POST['momenten_teksten_opslaan'] ) ) {
			check_admin_referer( 'momenten_teksten' );
			$this->bewaar_teksten();
			echo '<div class="notice notice-success is-dismissible"><p>Teksten opgeslagen.</p></div>';
		}

		if ( isset( $_POST['momenten_teksten_herstellen'] ) ) {
			check_admin_referer( 'momenten_teksten' );
			update_option( Momenten_Content::OPT_CONTENT, Momenten_Content::defaults() );
			echo '<div class="notice notice-success is-dismissible"><p>Standaardteksten hersteld.</p></div>';
		}

		$c = Momenten_Content::get_content();
		?>
		<div class="wrap momenten-wrap">
			<h1>Momenten &middot; Teksten</h1>
			<p class="momenten-uitleg">Hier pas je alle teksten aan die de bezoeker ziet. Plaats de gids op een pagina met de shortcode <code>[momenten]</code>.</p>
			<form method="post" style="margin:0 0 1em" onsubmit="return confirm('Alle teksten terugzetten naar de standaard? Je eigen wijzigingen gaan dan verloren.');">
				<?php wp_nonce_field( 'momenten_teksten' ); ?>
				<button type="submit" name="momenten_teksten_herstellen" class="button">Standaardteksten herstellen</button>
				<span class="description" style="margin-left:.5em">Zet alle teksten terug naar de meegeleverde versie.</span>
			</form>
			<form method="post">
				<?php wp_nonce_field( 'momenten_teksten' ); ?>

				<h2>Welkomstscherm</h2>
				<table class="form-table">
					<tr>
						<th><label for="welkom_titel">Titel</label></th>
						<td><input type="text" id="welkom_titel" name="welkom[titel]" class="regular-text" value="<?php echo esc_attr( $c['welkom']['titel'] ); ?>"></td>
					</tr>
					<tr>
						<th><label for="welkom_tekst">Tekst</label></th>
						<td>
							<textarea id="welkom_tekst" name="welkom[tekst]" rows="5" class="large-text"><?php echo esc_textarea( $c['welkom']['tekst'] ); ?></textarea>
							<p class="description">Een lege regel begint een nieuwe alinea.</p>
						</td>
					</tr>
				</table>

				<h2>Momenten</h2>
				<table class="form-table">
					<tr>
						<th><label for="moment_label">Label boven elk moment</label></th>
						<td>
							<input type="text" id="moment_label" name="moment_label" class="regular-text" value="<?php echo esc_attr( $c['moment_label'] ); ?>">
							<p class="description">Staat boven de titel, met het nummer erachter (bijv. "Moment 1"). Laat leeg als je er niks boven wilt.</p>
						</td>
					</tr>
				</table>
				<p class="description">Sleep-vrij: gebruik de knoppen om te ordenen. Je kunt momenten toevoegen en verwijderen.</p>
				<div id="momenten-lijst">
					<?php foreach ( $c['momenten'] as $i => $m ) : ?>
						<?php $this->render_moment_kaart( $i, $m ); ?>
					<?php endforeach; ?>
				</div>
				<p><button type="button" class="button" id="moment-toevoegen">+ Moment toevoegen</button></p>

				<h2>Bewaarscherm (e-mail vragen)</h2>
				<table class="form-table">
					<tr>
						<th><label>Titel</label></th>
						<td><input type="text" name="bewaar[titel]" class="regular-text" value="<?php echo esc_attr( $c['bewaar']['titel'] ); ?>"></td>
					</tr>
					<tr>
						<th><label>Tekst</label></th>
						<td><textarea name="bewaar[tekst]" rows="3" class="large-text"><?php echo esc_textarea( $c['bewaar']['tekst'] ); ?></textarea></td>
					</tr>
					<tr>
						<th><label>Knoptekst</label></th>
						<td><input type="text" name="bewaar[knop]" class="regular-text" value="<?php echo esc_attr( $c['bewaar']['knop'] ); ?>"></td>
					</tr>
					<tr>
						<th><label>Bevestigingsregel</label></th>
						<td><input type="text" name="bewaar[bevestigTekst]" class="regular-text" value="<?php echo esc_attr( $c['bewaar']['bevestigTekst'] ); ?>"></td>
					</tr>
					<tr>
						<th><label>Privacyregel</label></th>
						<td><input type="text" name="bewaar[privacyTekst]" class="regular-text" value="<?php echo esc_attr( $c['bewaar']['privacyTekst'] ); ?>"></td>
					</tr>
				</table>

				<h2>Afrondscherm</h2>
				<table class="form-table">
					<tr>
						<th><label>Titel</label></th>
						<td><input type="text" name="afrond[titel]" class="regular-text" value="<?php echo esc_attr( $c['afrond']['titel'] ); ?>"></td>
					</tr>
					<tr>
						<th><label>Tekst</label></th>
						<td><textarea name="afrond[tekst]" rows="4" class="large-text"><?php echo esc_textarea( $c['afrond']['tekst'] ); ?></textarea></td>
					</tr>
				</table>

				<p><button type="submit" name="momenten_teksten_opslaan" class="button button-primary">Teksten opslaan</button></p>
			</form>

			<?php $this->render_moment_template(); ?>
		</div>
		<?php
	}

	/** Eén moment-kaart in het formulier. */
	private function render_moment_kaart( $i, $m ) {
		$m = wp_parse_args(
			$m,
			array( 'id' => '', 'nav' => '', 'titel' => '', 'intro' => '', 'oefeningTitel' => '', 'oefeningTekst' => '', 'vraag' => '', 'placeholder' => '', 'type' => 'open', 'opties' => array(), 'meerkeuze' => 0, 'anders' => 0 )
		);
		$opties_tekst = is_array( $m['opties'] ) ? implode( "\n", $m['opties'] ) : '';
		?>
		<div class="momenten-kaart">
			<div class="momenten-kaart-kop">
				<strong class="momenten-kaart-titel">Moment <span class="momenten-nr"></span></strong>
				<span class="momenten-kaart-knoppen">
					<button type="button" class="button-link moment-omhoog" title="Omhoog">&uarr;</button>
					<button type="button" class="button-link moment-omlaag" title="Omlaag">&darr;</button>
					<button type="button" class="button-link moment-verwijder" title="Verwijderen">Verwijderen</button>
				</span>
			</div>
			<input type="hidden" name="momenten[<?php echo esc_attr( $i ); ?>][id]" value="<?php echo esc_attr( $m['id'] ); ?>">
			<table class="form-table">
				<tr>
					<th>Titel</th>
					<td><input type="text" name="momenten[<?php echo esc_attr( $i ); ?>][titel]" class="regular-text" value="<?php echo esc_attr( $m['titel'] ); ?>"></td>
				</tr>
				<tr>
					<th>Inleiding</th>
					<td><textarea name="momenten[<?php echo esc_attr( $i ); ?>][intro]" rows="3" class="large-text"><?php echo esc_textarea( $m['intro'] ); ?></textarea></td>
				</tr>
				<tr>
					<th>Opdracht-titel</th>
					<td><input type="text" name="momenten[<?php echo esc_attr( $i ); ?>][oefeningTitel]" class="regular-text" value="<?php echo esc_attr( $m['oefeningTitel'] ); ?>"></td>
				</tr>
				<tr>
					<th>Opdracht-tekst</th>
					<td><textarea name="momenten[<?php echo esc_attr( $i ); ?>][oefeningTekst]" rows="3" class="large-text"><?php echo esc_textarea( $m['oefeningTekst'] ); ?></textarea></td>
				</tr>
				<tr>
					<th>Vraag</th>
					<td><input type="text" name="momenten[<?php echo esc_attr( $i ); ?>][vraag]" class="large-text" value="<?php echo esc_attr( $m['vraag'] ); ?>"></td>
				</tr>
				<tr>
					<th>Soort antwoord</th>
					<td>
						<select name="momenten[<?php echo esc_attr( $i ); ?>][type]">
							<option value="open" <?php selected( $m['type'], 'open' ); ?>>Open tekstvak (zelf schrijven)</option>
							<option value="keuze" <?php selected( $m['type'], 'keuze' ); ?>>Meerkeuze (aanvinken)</option>
						</select>
					</td>
				</tr>
				<tr>
					<th>Opties (bij meerkeuze)</th>
					<td>
						<textarea name="momenten[<?php echo esc_attr( $i ); ?>][opties]" rows="5" class="large-text" placeholder="Eén optie per regel"><?php echo esc_textarea( $opties_tekst ); ?></textarea>
						<p class="description">Eén antwoordoptie per regel. Alleen gebruikt bij meerkeuze.</p>
						<label style="display:block;margin-top:.4em"><input type="checkbox" name="momenten[<?php echo esc_attr( $i ); ?>][meerkeuze]" value="1" <?php checked( $m['meerkeuze'], 1 ); ?>> Meerdere antwoorden mogelijk</label>
						<label style="display:block"><input type="checkbox" name="momenten[<?php echo esc_attr( $i ); ?>][anders]" value="1" <?php checked( $m['anders'], 1 ); ?>> Eigen antwoord toestaan ("Anders, namelijk")</label>
					</td>
				</tr>
				<tr>
					<th>Placeholder invulveld</th>
					<td><input type="text" name="momenten[<?php echo esc_attr( $i ); ?>][placeholder]" class="regular-text" value="<?php echo esc_attr( $m['placeholder'] ); ?>">
					<p class="description">Alleen bij een open tekstvak.</p></td>
				</tr>
			</table>
		</div>
		<?php
	}

	/** Verborgen sjabloon voor een nieuw moment (index __i__ wordt door js vervangen). */
	private function render_moment_template() {
		echo '<script type="text/template" id="moment-template">';
		$this->render_moment_kaart( '__i__', array( 'id' => '' ) );
		echo '</script>';
	}

	private function bewaar_teksten() {
		$in  = wp_unslash( $_POST );
		$out = Momenten_Content::get_content();

		$out['moment_label'] = sanitize_text_field( $in['moment_label'] ?? '' );

		$out['welkom'] = array(
			'titel' => sanitize_text_field( $in['welkom']['titel'] ?? '' ),
			'tekst' => sanitize_textarea_field( $in['welkom']['tekst'] ?? '' ),
		);

		$momenten = array();
		if ( isset( $in['momenten'] ) && is_array( $in['momenten'] ) ) {
			foreach ( $in['momenten'] as $m ) {
				$titel = sanitize_text_field( $m['titel'] ?? '' );
				$vraag = sanitize_text_field( $m['vraag'] ?? '' );
				// Sla een volledig leeg moment over.
				if ( '' === $titel && '' === $vraag ) {
					continue;
				}
				$id = sanitize_key( $m['id'] ?? '' );
				if ( '' === $id ) {
					$id = 'm' . wp_generate_password( 6, false, false );
				}
				// Opties opschonen: één per regel.
				$opties = array();
				$ruwe_opties = $m['opties'] ?? '';
				if ( is_string( $ruwe_opties ) && '' !== trim( $ruwe_opties ) ) {
					foreach ( preg_split( '/\r\n|\r|\n/', $ruwe_opties ) as $regel ) {
						$regel = sanitize_text_field( $regel );
						if ( '' !== trim( $regel ) ) {
							$opties[] = $regel;
						}
					}
				}
				// Nummering volgt automatisch de volgorde (1, 2, 3, ...).
				$momenten[] = array(
					'id'            => $id,
					'nav'           => (string) ( count( $momenten ) + 1 ),
					'titel'         => $titel,
					'intro'         => sanitize_textarea_field( $m['intro'] ?? '' ),
					'oefeningTitel' => sanitize_text_field( $m['oefeningTitel'] ?? '' ),
					'oefeningTekst' => sanitize_textarea_field( $m['oefeningTekst'] ?? '' ),
					'vraag'         => $vraag,
					'placeholder'   => sanitize_text_field( $m['placeholder'] ?? '' ),
					'type'          => ( 'keuze' === ( $m['type'] ?? 'open' ) ) ? 'keuze' : 'open',
					'opties'        => $opties,
					'meerkeuze'     => empty( $m['meerkeuze'] ) ? 0 : 1,
					'anders'        => empty( $m['anders'] ) ? 0 : 1,
				);
			}
		}
		if ( ! empty( $momenten ) ) {
			$out['momenten'] = $momenten;
		}

		$out['bewaar'] = array(
			'titel'         => sanitize_text_field( $in['bewaar']['titel'] ?? '' ),
			'tekst'         => sanitize_textarea_field( $in['bewaar']['tekst'] ?? '' ),
			'knop'          => sanitize_text_field( $in['bewaar']['knop'] ?? '' ),
			'bevestigTekst' => sanitize_text_field( $in['bewaar']['bevestigTekst'] ?? '' ),
			'privacyTekst'  => sanitize_text_field( $in['bewaar']['privacyTekst'] ?? '' ),
		);

		$out['afrond'] = array(
			'titel' => sanitize_text_field( $in['afrond']['titel'] ?? '' ),
			'tekst' => sanitize_textarea_field( $in['afrond']['tekst'] ?? '' ),
		);

		update_option( Momenten_Content::OPT_CONTENT, $out );
	}

	/* ─────────────────────────── Instellingen ─────────────────────────── */

	public function pagina_instellingen() {
		if ( ! current_user_can( self::CAP ) ) {
			return;
		}

		$test_melding = '';
		if ( isset( $_POST['momenten_instellingen_opslaan'] ) ) {
			check_admin_referer( 'momenten_instellingen' );
			$this->bewaar_instellingen();
			echo '<div class="notice notice-success is-dismissible"><p>Instellingen opgeslagen.</p></div>';
		}
		if ( isset( $_POST['momenten_test_mailerlite'] ) ) {
			check_admin_referer( 'momenten_instellingen' );
			$sleutel = sanitize_text_field( wp_unslash( $_POST['settings']['mailerlite_api_key'] ?? '' ) );
			$res     = Momenten_MailerLite::test_sleutel( $sleutel );
			if ( is_wp_error( $res ) ) {
				echo '<div class="notice notice-error is-dismissible"><p>MailerLite: ' . esc_html( $res->get_error_message() ) . '</p></div>';
			} else {
				echo '<div class="notice notice-success is-dismissible"><p>MailerLite-sleutel werkt.</p></div>';
			}
		}

		$s = Momenten_Content::get_settings();
		?>
		<div class="wrap momenten-wrap">
			<h1>Momenten &middot; Instellingen</h1>
			<form method="post">
				<?php wp_nonce_field( 'momenten_instellingen' ); ?>

				<h2>Logo</h2>
				<table class="form-table">
					<tr>
						<th><label>Logo bovenaan de gids</label></th>
						<td>
							<div class="momenten-logo-preview">
								<?php if ( $s['logo_url'] ) : ?>
									<img src="<?php echo esc_url( $s['logo_url'] ); ?>" alt="">
								<?php endif; ?>
							</div>
							<input type="hidden" name="settings[logo_url]" id="momenten_logo_url" value="<?php echo esc_url( $s['logo_url'] ); ?>">
							<button type="button" class="button" id="momenten-logo-kies">Afbeelding kiezen</button>
							<button type="button" class="button" id="momenten-logo-verwijder">Verwijderen</button>
							<p class="description">Verschijnt bovenaan de gids, naast de stappen. Laat leeg voor geen logo.</p>
						</td>
					</tr>
					<tr>
						<th><label>Logo-grootte</label></th>
						<td>
							<input type="number" min="24" max="220" name="settings[logo_grootte]" class="small-text" value="<?php echo esc_attr( $s['logo_grootte'] ); ?>"> px hoog
							<p class="description">Hoe groot het logo bovenaan de gids staat. Standaard 120.</p>
						</td>
					</tr>
					<tr>
						<th><label>Logo laten uitsteken</label></th>
						<td>
							<label><input type="checkbox" name="settings[logo_uitsteken]" value="1" <?php checked( $s['logo_uitsteken'], 1 ); ?>> Het logo iets buiten de rand laten uitsteken</label>
						</td>
					</tr>
				</table>

				<h2>MailerLite</h2>
				<table class="form-table">
					<tr>
						<th><label>API-sleutel</label></th>
						<td>
							<input type="password" name="settings[mailerlite_api_key]" class="regular-text" value="<?php echo esc_attr( $s['mailerlite_api_key'] ); ?>" autocomplete="off">
							<button type="submit" name="momenten_test_mailerlite" class="button">Testen</button>
							<p class="description">Nieuwe sleutel via MailerLite &rarr; Integrations &rarr; API. De sleutel blijft op deze site en is nooit publiek zichtbaar.</p>
						</td>
					</tr>
					<tr>
						<th><label>Groep-ID</label></th>
						<td>
							<input type="text" name="settings[mailerlite_group_id]" class="regular-text" value="<?php echo esc_attr( $s['mailerlite_group_id'] ); ?>">
							<p class="description">Het ID van de groep waar het e-mailadres in moet komen.</p>
						</td>
					</tr>
				</table>

				<h2>Meldingen &amp; afzender</h2>
				<table class="form-table">
					<tr>
						<th><label>Melding naar</label></th>
						<td><input type="email" name="settings[notificatie_email]" class="regular-text" value="<?php echo esc_attr( $s['notificatie_email'] ); ?>">
						<p class="description">Naar dit adres krijg je bericht bij een nieuwe inzending.</p></td>
					</tr>
					<tr>
						<th><label>Afzendernaam brief</label></th>
						<td><input type="text" name="settings[afzender_naam]" class="regular-text" value="<?php echo esc_attr( $s['afzender_naam'] ); ?>"></td>
					</tr>
					<tr>
						<th><label>Afzenderadres brief</label></th>
						<td><input type="email" name="settings[afzender_email]" class="regular-text" value="<?php echo esc_attr( $s['afzender_email'] ); ?>"></td>
					</tr>
					<tr>
						<th><label>Bewaartermijn (dagen)</label></th>
						<td><input type="number" min="0" name="settings[bewaartermijn_dagen]" class="small-text" value="<?php echo esc_attr( $s['bewaartermijn_dagen'] ); ?>">
						<p class="description">0 = onbeperkt bewaren. Anders worden inzendingen na zoveel dagen automatisch verwijderd.</p></td>
					</tr>
				</table>

				<h2>Kleuren</h2>
				<table class="form-table">
					<tr>
						<th><label>Accentkleur</label></th>
						<td><input type="text" name="settings[accent_kleur]" class="regular-text momenten-kleur" value="<?php echo esc_attr( $s['accent_kleur'] ); ?>" placeholder="#6d84a8"></td>
					</tr>
					<tr>
						<th><label>Tekstkleur</label></th>
						<td><input type="text" name="settings[tekst_kleur]" class="regular-text momenten-kleur" value="<?php echo esc_attr( $s['tekst_kleur'] ); ?>" placeholder="#3d3530"></td>
					</tr>
					<tr>
						<th><label>Kleur tekstkader</label></th>
						<td>
							<input type="text" name="settings[kaart_kleur]" class="regular-text momenten-kleur" value="<?php echo esc_attr( $s['kaart_kleur'] ); ?>" placeholder="#ffffff">
							<p class="description">De achtergrond van het vak waar de tekst in staat.</p>
						</td>
					</tr>
					<tr>
						<th><label>Achtergrondkleur</label></th>
						<td>
							<input type="text" name="settings[achtergrond_kleur]" class="regular-text momenten-kleur" value="<?php echo esc_attr( $s['achtergrond_kleur'] ); ?>" placeholder="#fdf9f4">
							<p class="description">Wordt niet gebruikt als je hieronder "Achtergrond doorzichtig" aanzet.</p>
						</td>
					</tr>
				</table>

				<h2>Rand &amp; achtergrond</h2>
				<table class="form-table">
					<tr>
						<th><label>Achtergrond doorzichtig</label></th>
						<td>
							<label><input type="checkbox" name="settings[achtergrond_transparant]" value="1" <?php checked( $s['achtergrond_transparant'], 1 ); ?>> De achtergrond van de website gebruiken (geen eigen achtergrondkleur)</label>
						</td>
					</tr>
					<tr>
						<th><label>Rand tonen</label></th>
						<td>
							<label><input type="checkbox" name="settings[rand_aan]" value="1" <?php checked( $s['rand_aan'], 1 ); ?>> Een omkadering om de gids tonen</label>
						</td>
					</tr>
					<tr>
						<th><label>Randkleur</label></th>
						<td><input type="text" name="settings[rand_kleur]" class="regular-text momenten-kleur" value="<?php echo esc_attr( $s['rand_kleur'] ); ?>" placeholder="#6d84a8"></td>
					</tr>
					<tr>
						<th><label>Afronding hoeken</label></th>
						<td>
							<input type="number" min="0" max="40" name="settings[hoek_afronding]" class="small-text" value="<?php echo esc_attr( $s['hoek_afronding'] ); ?>"> px
							<p class="description">0 = rechte hoeken, hoger = ronder. Standaard 20.</p>
						</td>
					</tr>
				</table>

				<h2>Lettertype</h2>
				<table class="form-table">
					<tr>
						<th><label>Lettertype</label></th>
						<td>
							<?php
							$fonts = array(
								'default'  => 'Standaard (lettertype van de website)',
								'serif'    => 'Serif (klassiek, met schreef)',
								'sans'     => 'Sans-serif (strak, zonder schreef)',
								'playfair' => 'Playfair Display (elegante serif)',
								'lora'     => 'Lora (zachte serif)',
								'poppins'  => 'Poppins (moderne sans)',
								'nunito'   => 'Nunito (vriendelijke sans)',
							);
							$huidig_font = isset( $fonts[ $s['lettertype'] ] ) ? $s['lettertype'] : 'default';
							?>
							<select name="settings[lettertype]">
								<?php foreach ( $fonts as $key => $label ) : ?>
									<option value="<?php echo esc_attr( $key ); ?>" <?php selected( $huidig_font, $key ); ?>><?php echo esc_html( $label ); ?></option>
								<?php endforeach; ?>
							</select>
							<p class="description">Kies "Standaard" om automatisch het lettertype van je website te gebruiken.</p>
						</td>
					</tr>
				</table>

				<h2>Functies</h2>
				<table class="form-table">
					<tr>
						<th><label>Inspreken</label></th>
						<td>
							<label><input type="checkbox" name="settings[inspreken_aan]" value="1" <?php checked( $s['inspreken_aan'], 1 ); ?>> Bezoekers kunnen hun antwoord ook inspreken (spraak naar tekst)</label>
						</td>
					</tr>
				</table>

				<h2>Pop-up bij scrollen</h2>
				<p class="description">Laat de gids als uitnodiging verschijnen zodra de bezoeker een stukje scrollt. Werkt op elke pagina, ook zonder de shortcode. Kleur en lettertype volgen je instellingen hierboven.</p>
				<table class="form-table">
					<tr>
						<th><label>Pop-up tonen</label></th>
						<td>
							<label><input type="checkbox" name="settings[popup_aan]" value="1" <?php checked( $s['popup_aan'], 1 ); ?>> De gids als pop-up laten verschijnen bij scrollen</label>
						</td>
					</tr>
					<tr>
						<th><label>Verschijnen bij</label></th>
						<td>
							<input type="number" min="0" max="100" name="settings[popup_scroll]" class="small-text" value="<?php echo esc_attr( $s['popup_scroll'] ); ?>"> % van de pagina gescrold
							<p class="description">0 = meteen, 40 = nadat ze bijna de helft naar beneden zijn.</p>
						</td>
					</tr>
					<tr>
						<th><label>Verschijnen met</label></th>
						<td>
							<select name="settings[popup_animatie]">
								<option value="fade" <?php selected( $s['popup_animatie'], 'fade' ); ?>>Zacht infaden</option>
								<option value="pop" <?php selected( $s['popup_animatie'], 'pop' ); ?>>In het midden opkomen</option>
							</select>
						</td>
					</tr>
					<tr>
						<th><label>Afbeelding</label></th>
						<td>
							<div class="momenten-popupimg-preview">
								<?php if ( $s['popup_afbeelding'] ) : ?>
									<img src="<?php echo esc_url( $s['popup_afbeelding'] ); ?>" alt="">
								<?php endif; ?>
							</div>
							<input type="hidden" name="settings[popup_afbeelding]" id="momenten_popupimg_url" value="<?php echo esc_url( $s['popup_afbeelding'] ); ?>">
							<button type="button" class="button" id="momenten-popupimg-kies">Afbeelding kiezen</button>
							<button type="button" class="button" id="momenten-popupimg-verwijder">Verwijderen</button>
							<p class="description">Optioneel, bovenaan de uitnodiging. Laat leeg voor een pop-up zonder afbeelding. Een brede foto van ongeveer 800 bij 400 px staat het mooist.</p>
						</td>
					</tr>
					<tr>
						<th><label>Afbeelding tonen als</label></th>
						<td>
							<select name="settings[popup_fit]">
								<option value="cover" <?php selected( $s['popup_fit'], 'cover' ); ?>>Vullend (netjes bijgesneden, mooi voor een foto)</option>
								<option value="contain" <?php selected( $s['popup_fit'], 'contain' ); ?>>Passend (helemaal zichtbaar, mooi voor een logo)</option>
							</select>
						</td>
					</tr>
					<tr>
						<th><label>Opnieuw tonen na</label></th>
						<td>
							<input type="number" min="0" max="365" name="settings[popup_herhaal_dagen]" class="small-text" value="<?php echo esc_attr( $s['popup_herhaal_dagen'] ); ?>"> dagen
							<p class="description">Nadat iemand de pop-up wegklikt, komt hij zoveel dagen niet terug. Zet op 0 om hem elke keer te tonen (handig om te testen).</p>
						</td>
					</tr>
					<tr>
						<th><label>Titel</label></th>
						<td><input type="text" name="settings[popup_titel]" class="regular-text" value="<?php echo esc_attr( $s['popup_titel'] ); ?>"></td>
					</tr>
					<tr>
						<th><label>Tekst</label></th>
						<td><textarea name="settings[popup_tekst]" rows="3" class="large-text"><?php echo esc_textarea( $s['popup_tekst'] ); ?></textarea></td>
					</tr>
					<tr>
						<th><label>Knoptekst</label></th>
						<td><input type="text" name="settings[popup_knop]" class="regular-text" value="<?php echo esc_attr( $s['popup_knop'] ); ?>"></td>
					</tr>
				</table>

				<p><button type="submit" name="momenten_instellingen_opslaan" class="button button-primary">Instellingen opslaan</button></p>
			</form>
		</div>
		<?php
	}

	private function bewaar_instellingen() {
		$in  = wp_unslash( $_POST['settings'] ?? array() );
		$out = Momenten_Content::get_settings();

		$out['mailerlite_api_key']  = sanitize_text_field( $in['mailerlite_api_key'] ?? '' );
		$out['mailerlite_group_id'] = sanitize_text_field( $in['mailerlite_group_id'] ?? '' );
		$out['notificatie_email']   = sanitize_email( $in['notificatie_email'] ?? '' );
		$out['afzender_naam']       = sanitize_text_field( $in['afzender_naam'] ?? '' );
		$out['afzender_email']      = sanitize_email( $in['afzender_email'] ?? '' );
		$out['bewaartermijn_dagen'] = absint( $in['bewaartermijn_dagen'] ?? 0 );
		$out['accent_kleur']        = sanitize_hex_color( $in['accent_kleur'] ?? '' ) ?: '#6d84a8';
		$out['tekst_kleur']         = sanitize_hex_color( $in['tekst_kleur'] ?? '' ) ?: '#3d3530';
		$out['achtergrond_kleur']   = sanitize_hex_color( $in['achtergrond_kleur'] ?? '' ) ?: '#fdf9f4';
		$out['kaart_kleur']         = sanitize_hex_color( $in['kaart_kleur'] ?? '' ) ?: '#ffffff';
		$out['inspreken_aan']       = empty( $in['inspreken_aan'] ) ? 0 : 1;
		$out['achtergrond_transparant'] = empty( $in['achtergrond_transparant'] ) ? 0 : 1;
		$out['rand_aan']            = empty( $in['rand_aan'] ) ? 0 : 1;
		$out['rand_kleur']          = sanitize_hex_color( $in['rand_kleur'] ?? '' ) ?: '#6d84a8';
		$out['hoek_afronding']      = max( 0, min( 40, absint( $in['hoek_afronding'] ?? 20 ) ) );
		$toegestane_fonts          = array( 'default', 'serif', 'sans', 'playfair', 'lora', 'poppins', 'nunito' );
		$gekozen_font              = sanitize_key( $in['lettertype'] ?? 'default' );
		$out['lettertype']          = in_array( $gekozen_font, $toegestane_fonts, true ) ? $gekozen_font : 'default';
		$out['logo_url']            = esc_url_raw( $in['logo_url'] ?? '' );
		$out['logo_grootte']        = max( 24, min( 220, absint( $in['logo_grootte'] ?? 120 ) ) );
		$out['logo_uitsteken']      = empty( $in['logo_uitsteken'] ) ? 0 : 1;

		$out['popup_aan']           = empty( $in['popup_aan'] ) ? 0 : 1;
		$out['popup_scroll']        = max( 0, min( 100, absint( $in['popup_scroll'] ?? 40 ) ) );
		$out['popup_animatie']      = ( 'pop' === ( $in['popup_animatie'] ?? 'fade' ) ) ? 'pop' : 'fade';
		$out['popup_fit']           = ( 'contain' === ( $in['popup_fit'] ?? 'cover' ) ) ? 'contain' : 'cover';
		$out['popup_herhaal_dagen'] = max( 0, min( 365, absint( $in['popup_herhaal_dagen'] ?? 7 ) ) );
		$out['popup_afbeelding']    = esc_url_raw( $in['popup_afbeelding'] ?? '' );
		$out['popup_titel']         = sanitize_text_field( $in['popup_titel'] ?? '' );
		$out['popup_tekst']         = sanitize_textarea_field( $in['popup_tekst'] ?? '' );
		$out['popup_knop']          = sanitize_text_field( $in['popup_knop'] ?? '' );

		update_option( Momenten_Content::OPT_SETTINGS, $out );
	}

	/* ─────────────────────────── Inzendingen ─────────────────────────── */

	public function pagina_inzendingen() {
		if ( ! current_user_can( self::CAP ) ) {
			return;
		}

		// Acties: verwijderen of brief versturen.
		if ( isset( $_POST['momenten_verwijder'] ) ) {
			check_admin_referer( 'momenten_inzending' );
			Momenten_DB::verwijder( absint( $_POST['inzending_id'] ?? 0 ) );
			// Terug naar de lijst tonen in plaats van de verwijderde inzending.
			unset( $_GET['bekijk'] );
			echo '<div class="notice notice-success is-dismissible"><p>Inzending verwijderd.</p></div>';
		}
		if ( isset( $_POST['momenten_verstuur_brief'] ) ) {
			check_admin_referer( 'momenten_inzending' );
			$this->verstuur_brief( absint( $_POST['inzending_id'] ?? 0 ), wp_unslash( $_POST['brief'] ?? '' ) );
		}

		$bekijk_id = isset( $_GET['bekijk'] ) ? absint( $_GET['bekijk'] ) : 0;
		if ( $bekijk_id ) {
			$this->render_inzending_detail( $bekijk_id );
			return;
		}

		$rijen = Momenten_DB::lijst( 300 );
		?>
		<div class="wrap momenten-wrap">
			<h1>Momenten &middot; Inzendingen</h1>
			<table class="wp-list-table widefat fixed striped">
				<thead>
					<tr>
						<th>Datum</th>
						<th>Naam</th>
						<th>E-mail</th>
						<th>Status</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					<?php if ( empty( $rijen ) ) : ?>
						<tr><td colspan="5">Nog geen inzendingen.</td></tr>
					<?php else : ?>
						<?php foreach ( $rijen as $r ) : ?>
							<tr>
								<td><?php echo esc_html( mysql2date( 'j M Y H:i', $r->aangemaakt ) ); ?></td>
								<td><?php echo esc_html( $r->naam ? $r->naam : '—' ); ?></td>
								<td><?php echo esc_html( $r->email ); ?></td>
								<td>
									<?php if ( 'verzonden' === $r->status ) : ?>
										<span class="momenten-badge verzonden">Brief verstuurd</span>
									<?php else : ?>
										<span class="momenten-badge nieuw">Nieuw</span>
									<?php endif; ?>
								</td>
								<td><a class="button button-small" href="<?php echo esc_url( admin_url( 'admin.php?page=momenten-inzendingen&bekijk=' . (int) $r->id ) ); ?>">Bekijken</a></td>
							</tr>
						<?php endforeach; ?>
					<?php endif; ?>
				</tbody>
			</table>
		</div>
		<?php
	}

	private function render_inzending_detail( $id ) {
		$r = Momenten_DB::get( $id );
		if ( ! $r ) {
			echo '<div class="wrap"><p>Inzending niet gevonden.</p></div>';
			return;
		}
		$antwoorden = json_decode( $r->antwoorden, true );
		$antwoorden = is_array( $antwoorden ) ? $antwoorden : array();
		?>
		<div class="wrap momenten-wrap">
			<h1>Inzending van <?php echo esc_html( $r->naam ? $r->naam : $r->email ); ?></h1>
			<p><a href="<?php echo esc_url( admin_url( 'admin.php?page=momenten-inzendingen' ) ); ?>">&larr; Terug naar alle inzendingen</a></p>

			<table class="form-table">
				<tr><th>Datum</th><td><?php echo esc_html( mysql2date( 'j M Y H:i', $r->aangemaakt ) ); ?></td></tr>
				<tr><th>Naam</th><td><?php echo esc_html( $r->naam ? $r->naam : '—' ); ?></td></tr>
				<tr><th>E-mail</th><td><?php echo esc_html( $r->email ); ?></td></tr>
			</table>

			<h2>Wat is er gedeeld</h2>
			<div class="momenten-antwoorden">
				<?php foreach ( $antwoorden as $a ) : ?>
					<div class="momenten-antwoord">
						<p class="momenten-antwoord-vraag"><?php echo esc_html( ( $a['moment'] ? 'Moment ' . $a['moment'] . ': ' : '' ) . ( $a['vraag'] ?? '' ) ); ?></p>
						<p class="momenten-antwoord-tekst"><?php echo nl2br( esc_html( $a['antwoord'] ?? '' ) ); ?></p>
					</div>
				<?php endforeach; ?>
			</div>

			<h2><?php echo 'verzonden' === $r->status ? 'Verstuurde brief' : 'Schrijf de brief'; ?></h2>
			<form method="post">
				<?php wp_nonce_field( 'momenten_inzending' ); ?>
				<input type="hidden" name="inzending_id" value="<?php echo (int) $r->id; ?>">
				<textarea name="brief" rows="12" class="large-text" <?php echo 'verzonden' === $r->status ? 'readonly' : ''; ?>><?php echo esc_textarea( $r->brief ); ?></textarea>
				<?php if ( 'verzonden' === $r->status ) : ?>
					<p class="description">Deze brief is op <?php echo esc_html( mysql2date( 'j M Y H:i', $r->verzonden ) ); ?> verstuurd.</p>
				<?php else : ?>
					<p>
						<button type="submit" name="momenten_verstuur_brief" class="button button-primary" onclick="return confirm('De brief nu naar <?php echo esc_js( $r->email ); ?> versturen?');">Brief versturen</button>
					</p>
				<?php endif; ?>
			</form>

			<hr>
			<form method="post" onsubmit="return confirm('Deze inzending definitief verwijderen?');">
				<?php wp_nonce_field( 'momenten_inzending' ); ?>
				<input type="hidden" name="inzending_id" value="<?php echo (int) $r->id; ?>">
				<button type="submit" name="momenten_verwijder" class="button-link-delete button-link">Inzending verwijderen</button>
			</form>
		</div>
		<?php
	}

	private function verstuur_brief( $id, $brief ) {
		$r = Momenten_DB::get( $id );
		if ( ! $r ) {
			echo '<div class="notice notice-error is-dismissible"><p>Inzending niet gevonden.</p></div>';
			return;
		}
		$brief = trim( wp_strip_all_tags( $brief ) );
		if ( '' === $brief ) {
			echo '<div class="notice notice-error is-dismissible"><p>De brief is nog leeg.</p></div>';
			return;
		}
		$s        = Momenten_Content::get_settings();
		$afz_naam = $s['afzender_naam'] ? $s['afzender_naam'] : get_option( 'blogname' );
		$afz_mail = is_email( $s['afzender_email'] ) ? $s['afzender_email'] : get_option( 'admin_email' );
		$headers  = array(
			'From: ' . $afz_naam . ' <' . $afz_mail . '>',
			'Content-Type: text/plain; charset=UTF-8',
		);
		$onderwerp = 'Een brief voor jou';
		$ok        = wp_mail( $r->email, $onderwerp, $brief, $headers );
		if ( $ok ) {
			Momenten_DB::markeer_verzonden( $id, $brief );
			echo '<div class="notice notice-success is-dismissible"><p>Brief verstuurd naar ' . esc_html( $r->email ) . '.</p></div>';
		} else {
			echo '<div class="notice notice-error is-dismissible"><p>Versturen mislukte. Controleer de e-mailinstellingen van de site.</p></div>';
		}
	}
}
