// Encapsulation dans jQuery(document).ready pour garantir que le script s'exécute après le chargement complet du DOM
jQuery(document).ready(function ($) {
  // Déclarations des variables liées à la reconnaissance vocale et à la synthèse vocale
  let recognition;
  let synth = window.speechSynthesis;
  let isMicrophoneUsed = false;
  let isRecognizing = false;

  // ! FLUX VISUEL FORM CONNEXION

  // Gestion de l'affichage des formulaires en fonction du JWT
  function updateUI() {
    if (localStorage.getItem("jwt")) {
      $(".login-form").hide();
      $(".register-form").hide();
      $(".user-info .username-display").text(
        localStorage.getItem("displayName")
      );
      $(".user-info").show();
      $(".logout-button").show();
      $(".show-register-form").hide();
      $(".kh-controls-container").show();

      // Charger les actions seulement si l'utilisateur est connecté
      loadUserActions();
    } else {
      $(".login-form").show();
      $(".register-form").hide();
      $(".user-info").hide();
      $(".logout-button").hide();
      $(".show-register-form").show();
      $(".kh-response").html("");
      $(".kh-controls-container").hide();
      // Ne pas tenter de charger les actions si l'utilisateur n'est pas connecté
      $(".kh-list").html("<p>Connectez-vous pour voir vos actions.</p>");
    }
  }

  updateUI();

  // Montrer le formulaire d'inscription
  $(".show-register-form").click(function () {
    $(".login-form").hide();
    $(".register-form").show();
    $(this).hide();
  });

  // Retour au formulaire de connexion depuis l'inscription
  $(".back-to-login").click(function () {
    $(".register-form").hide();
    $(".login-form").show();
    $(".show-register-form").show();
  });

  // ! FONCTION REGISTER ET LOGIN

  // Fonction d'inscription
  function register() {
    var email = $(".register-email").val();
    var displayName = $(".register-display-name").val();
    var password = $(".register-password").val();
    var passwordConfirm = $(".register-password-confirm").val();

    if (password !== passwordConfirm) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }

    $.ajax({
      url: "https://kokuauhane-071dbd833182.herokuapp.com/register",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        email: email,
        password: password,
        display_name: displayName,
      }),
      success: function (response) {
        alert("Inscription réussie, veuillez vous connecter.");
        $(".login-form").show();
        $(".register-form").hide();
        $(".show-register-form").show();
        updateUI();
      },
      error: function (xhr) {
        alert("Erreur d'inscription: " + xhr.responseText);
      },
    });
  }

  // * Attache le gestionnaire d'événement au bouton d'inscription
  $(".register-button").click(register);

  // * Fonction de connexion
  function login() {
    var email = $("#email").val();
    var password = $("#password").val();

    $.ajax({
      url: "https://kokuauhane-071dbd833182.herokuapp.com/login",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({ email: email, password: password }),
      success: function (response) {
        localStorage.setItem("jwt", response.access_token);
        localStorage.setItem("displayName", response.displayName);
        updateUI();
      },
      error: function (xhr) {
        var errorMsg = JSON.parse(xhr.responseText).msg; // Parse le message d'erreur du serveur
        alert("Erreur de connexion: " + errorMsg); // Affiche un message d'erreur plus clair
      },
    });
  }

  // * Attache le gestionnaire d'événement au bouton de connexion
  $(".login-button").click(login);

  // * Fonction de déconnexion
  $(".logout-button").click(function () {
    localStorage.removeItem("jwt");
    localStorage.removeItem("displayName");
    updateUI();
  });

  // ! FIN FONCTION REGISTER ET LOGIN

  // Fonction pour initialiser la reconnaissance vocale
  function initializeRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.lang = "fr-FR";
      recognition.interimResults = false;

      recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        $(".kh-input").val(transcript);
        isMicrophoneUsed = true;
        $(".kh-button-send").click();
      };

      recognition.onerror = function (event) {
        console.error("Erreur de reconnaissance vocale: ", event.error);
      };

      recognition.onend = function () {
        if (isMicrophoneUsed) {
          toggleRecognition(true);
        }
      };
    } else {
      console.warn(
        "La reconnaissance vocale n'est pas prise en charge dans ce navigateur."
      );
    }
  }

  // Fonction pour activer ou désactiver la reconnaissance vocale
  function toggleRecognition(shouldStart) {
    if (recognition) {
      if (shouldStart && !isRecognizing) {
        recognition.start();
        isRecognizing = true;
        $(".listening-indicator").addClass("active"); // Ajoute la classe active pour afficher l'indicateur
      } else {
        recognition.stop();
        isRecognizing = false;
        $(".listening-indicator").removeClass("active"); // Retire la classe active pour masquer l'indicateur
      }
    }
  }

  // Fonction pour ajuster l'état des boutons
  function updateButtonStates() {
    let isLoggedIn = localStorage.getItem("jwt") !== null;
    $(".logout-button").toggleClass("show", isLoggedIn);
    let textLength = $(".kh-input").val().length;
    $(".kh-button-send").prop("disabled", textLength === 0);
    $(".kh-button-micro").prop("disabled", textLength !== 0);
    $(".kh-button-micro").prop("disabled", textLength !== 0 || synth.speaking);
    // $(".kh-button-stop").prop("disabled", !isRecognizing && !synth.speaking);

    $(".kh-input").prop("disabled", false);
    $(".kh-input").focus();
  }

  // Gestion des clics sur le bouton micro pour démarrer la reconnaissance
  $(".kh-button-micro").on("click", function () {
    toggleRecognition(true);
    isMicrophoneUsed = true;
    $(this).addClass("active");
  });

  // Gestion des clics sur le bouton stop pour arrêter la reconnaissance et la synthèse vocale
  $(".kh-button-stop").on("click", function () {
    toggleRecognition(false);
    isMicrophoneUsed = false;
    if (synth.speaking) {
      synth.cancel();
    }
    $(this).prop("disabled", true).removeClass("active");
    updateButtonStates();
  });

  // Envoi d'une requête POST avec le texte reconnu ou saisi
  $(".kh-button-send").click(function () {
    var inputText = $(".kh-input").val();
    $(".loading-indicator").addClass("active");
    $.ajax({
      //   url: "https://kokuauhane-071dbd833182.herokuapp.com/ask",
      // url: "https://kokuauhane-071dbd833182.herokuapp.com/interact",
      url: "https://kokuauhane-071dbd833182.herokuapp.com/propose_event",
      method: "POST",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("jwt"), // Utilisation du JWT
      },
      data: JSON.stringify({ question: inputText }),
      beforeSend: function () {
        $(".kh-button-send, .kh-button-stop, .kh-button-micro, .kh-input").prop(
          "disabled",
          true
        );
      },
      success: function (response) {
        $(".loading-indicator").removeClass("active");
        let currentHtml = $(".kh-response").html();

        let newMessage = response.message || "Pas de réponse spécifique."; // Gérer si message est undefined ou vide
        let newEvent = response.event
          ? response.event
          : "Pas d'événement détecté.";

        $(".kh-response").html(
          "<div class='message-block'><div class='message-content'>" +
            newMessage +
            "</div></div>" +
            "<div class='message-block'><div class='message-content'>" +
            newEvent +
            "</div></div>"
        );

        // * maj mood boutons confimer et annuler en append -------------

        // Condition pour ajouter les boutons seulement si un événement est détecté
        if (response.event && response.event !== "Pas d'événement détecté.") {
          $(".kh-response").append(
            "<div class='message-block'>" +
              "<button class='confirm-button'>Confirmer</button>" +
              "<button class='cancel-button'>Annuler</button>" +
              "</div>"
          );
        }

        // Ajuster le scroll si nécessaire pour montrer le contenu ajouté
        $(".kh-response").scrollTop($(".kh-response")[0].scrollHeight);

        // Écouteurs d'événements pour les boutons
        $(".confirm-button").click(function () {
          // Envoyer la confirmation à la route /confirm_event
          $.ajax({
            url: "https://kokuauhane-071dbd833182.herokuapp.com/confirm_event",
            method: "POST",
            contentType: "application/json",
            headers: {
              Authorization: "Bearer " + localStorage.getItem("jwt"),
            },
            data: JSON.stringify({
              confirmation: "Confirmer",
              event: response.event,
            }),
            success: function () {
              $(".kh-response").html(
                "<div class='message-block'>Événement confirmé.</div>"
              );
              loadUserActions();
            },
            error: function () {
              $(".kh-response").html(
                "<div class='message-block'>Erreur lors de la confirmation.</div>"
              );
            },
          });
        });

        $(".cancel-button").click(function () {
          // Vider la zone de réponse
          $(".kh-response").empty();
        });

        // * maj mood boutons confimer et annuler en append -------------

        $(".kh-input").val("");
        window.scrollTo(0, document.body.scrollHeight);

        if (isMicrophoneUsed) {
          let utterance = new SpeechSynthesisUtterance(response.response);
          utterance.onend = function () {
            toggleRecognition(true); // Réactivation de la reconnaissance vocale après la fin de la synthèse
            $(".kh-button-micro").prop("disabled", false); // Réactivation du bouton micro
            $(".kh-button-stop").prop("disabled", true); // Désactivation du bouton stop
            $(".listening-indicator").removeClass("active");
            // isMicrophoneUsed = false;
            updateButtonStates();
          };
          synth.speak(utterance);
          $(".kh-button-stop").prop("disabled", false);
          $(".kh-button-micro").prop("disabled", true);
          isMicrophoneUsed = false;
        } else {
          updateButtonStates();
        }
      },
      error: function () {
        $(".loading-indicator").removeClass("active");
        $(".kh-response").html(
          $(".kh-response").html() +
            "<div class='message-block'>Erreur lors de la communication avec le serveur.</div>"
        );
        updateButtonStates();
      },
    });
  });

  // Désactivation du bouton d'envoi et du bouton micro si le champ de saisie est vide, sinon activation
  $(".kh-input").on("input", function () {
    resizeTextarea(); // Ajuste la hauteur de la zone de texte à chaque saisie
    updateButtonStates(); // Mise à jour des états des boutons
  });

  // Fonction pour ajuster la hauteur de la zone de texte dynamiquement
  function resizeTextarea() {
    var textarea = document.querySelector(".kh-input");
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }

  // Initialisation de la reconnaissance vocale
  initializeRecognition();
  updateButtonStates(); // Mise à jour initiale des états des boutons

  // ! Extension get action dans kh-list -------------------

  // Fonction pour charger les actions de l'utilisateur après connexion réussie
  function loadUserActions() {
    $.ajax({
      url: "https://kokuauhane-071dbd833182.herokuapp.com/get_actions",
      method: "GET",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("jwt"), // Utilisation du JWT
      },
      success: function (data) {
        console.log(data);
        $(".kh-list").html("");

        if (
          !data["Aujourd'hui"].length &&
          !data["Hier"].length &&
          !data["Avant-Hier"].length
        ) {
          $(".kh-list").html("<p>Aucune action enregistrée récemment.</p>");
        } else {
          for (let day in data) {
            if (data[day].length) {
              let sectionHtml = `<div class='day-section'><div class='day-title'>${day}</div>`;
              for (let action of data[day]) {
                // Utilisez directement 'action' ici au lieu de 'action.action'
                sectionHtml += `<div class='action-item'>${action}</div>`;
              }
              sectionHtml += "</div>";
              $(".kh-list").append(sectionHtml);
            }
          }
        }
      },

      error: function () {
        $(".kh-list").html(
          "<p>Erreur lors du chargement des actions. Veuillez réessayer plus tard.</p>"
        );
      },
    });
  }
});
