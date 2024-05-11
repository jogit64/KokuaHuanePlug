<?php
/*
Plugin Name: Kokua Huane Widget
Description: Un widget qui affiche un champ de saisie avec des boutons pour envoyer, démarrer, et arrêter.
Version: 1.0
Author: Votre Nom
*/

// Inclure les scripts et styles
function kh_enqueue_scripts()
{
    global $post;
    // Vérifier si le shortcode du widget Kokua Huane est présent dans le contenu de la page
    if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'kokua_huane_widget')) {
        wp_enqueue_style('kh-style', plugins_url('css/style.css', __FILE__)); // Charger le CSS
        wp_enqueue_script('kh-script', plugins_url('js/script.js', __FILE__), array('jquery'), null, true); // Charger le JS
    }
}

add_action('wp_enqueue_scripts', 'kh_enqueue_scripts');



// Enregistrement du widget
function register_kokua_huane_widget()
{
    register_widget('Kokua_Huane_Widget');
}

add_action('widgets_init', 'register_kokua_huane_widget');

// Classe du widget
class Kokua_Huane_Widget extends WP_Widget
{
    public function __construct()
    {
        parent::__construct(
            'kokua_huane_widget',  // ID du widget
            'Kokua Huane Widget', // Nom du widget
            array('description' => 'Un widget interactif avec input et boutons.') // Description
        );
    }

    public function widget($args, $instance)
    {
        echo $args['before_widget'];
?>
        <div class="kh-widget">
            <!-- Barre de statut utilisateur -->
            <div class="user-info" style="display:none;">
                <img src="<?php echo plugins_url('assets/user.png', __FILE__); ?>" alt="User" class="user-icon">
                <span class="username-display"></span>
                <button class="logout-button">
                    <img src="<?php echo plugins_url('assets/exit.png', __FILE__); ?>" alt="Logout">
                </button>
            </div>

            <div class="register-form" style="display:none;">
                <input type="email" class="register-email" placeholder="Email" required />
                <input type="text" class="register-display-name" placeholder="Pseudo" />
                <input type="password" class="register-password" placeholder="Mot de passe" required />
                <input type="password" class="register-password-confirm" placeholder="Confirmez le mot de passe" required />
                <button class="register-button">Inscription</button>
                <button class="back-to-login">Retour à la connexion</button>
            </div>
            <button class="show-register-form">Afficher le formulaire d'inscription</button>


            <div class="login-form">
                <input type="email" id="email" name="email" placeholder="Email" required>
                <input type="password" id="password" name="password" placeholder="Mot de passe" required>
                <button class="login-button">Se connecter</button>
            </div>


            <!-- Assurez-vous que le widget utilise toute la hauteur de la fenêtre -->
            <div class="kh-list">

            </div>
            <div class="kh-response">

            </div>
            <div class="loading-indicator">
                <div class="loader">
                    <div class="bar"></div>
                    <div class="bar"></div>
                    <div class="bar"></div>
                </div>
            </div>
            <div class="kh-controls-container">
                <div class="kh-controls">
                    <button class="kh-button-micro"><img src="<?php echo plugins_url('assets/micro.png', __FILE__); ?>" alt="Micro"></button>
                    <button class="kh-button-stop" disabled="disabled"><img src="<?php echo plugins_url('assets/stop.png', __FILE__); ?>" alt="Stop"></button>
                    <textarea class="kh-input"></textarea>
                    <button class="kh-button-send" disabled="disabled"><img src="<?php echo plugins_url('assets/send.png', __FILE__); ?>" alt="Send"></button>


                    <div class="listening-indicator"></div><!-- Indicateur d'écoute -->
                </div>
            </div>

        </div>


<?php
        echo $args['after_widget'];
    }
}


function kh_widget_shortcode($atts)
{
    ob_start(); // Commence à capturer la sortie

    // Simulez l'instance et les arguments du widget si nécessaire
    $instance = []; // Modifiez selon les besoins pour contrôler les réglages du widget
    $args = ['before_widget' => '', 'after_widget' => ''];

    // Créez une instance de votre widget
    $widget = new Kokua_Huane_Widget();
    // Appeler la méthode widget de l'objet Widget, qui imprime le contenu du widget
    $widget->widget($args, $instance);

    // Récupérer le contenu du widget
    $content = ob_get_clean();
    return $content;
}

// Enregistrer le shortcode
add_shortcode('kokua_huane_widget', 'kh_widget_shortcode');


?>