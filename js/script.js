// Encapsulation dans jQuery(document).ready pour garantir que le script s'exécute après le chargement complet du DOM
jQuery(document).ready(function ($) {
  // Déclarations des variables liées à la reconnaissance vocale et à la synthèse vocale
  let recognition;
  let synth = window.speechSynthesis;
  let isMicrophoneUsed = false;
  let isRecognizing = false;

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
    let textLength = $(".kh-input").val().length;
    $(".kh-button-send").prop("disabled", textLength === 0);
    $(".kh-button-micro").prop("disabled", textLength !== 0);
    $(".kh-button-micro").prop("disabled", textLength !== 0 || synth.speaking);
    // $(".kh-button-stop").prop("disabled", !isRecognizing && !synth.speaking);

    $(".kh-input").prop("disabled", false);
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
      url: "https://kokuauhane-071dbd833182.herokuapp.com/ask",
      method: "POST",
      contentType: "application/json",
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
        $(".kh-response").html(
          currentHtml +
            "<div class='message-block'><span class='prefix'>USER:</span><div class='message-content'>" +
            inputText +
            "</div></div><div class='message-block'><span class='prefix'>STAN:</span><div class='message-content'>" +
            response.response +
            "</div></div>"
        );
        $(".kh-input").val("");
        window.scrollTo(0, document.body.scrollHeight);
        if (isMicrophoneUsed) {
          let utterance = new SpeechSynthesisUtterance(response.response);
          utterance.onend = function () {
            toggleRecognition(true); // Réactivation de la reconnaissance vocale après la fin de la synthèse
            $(".kh-button-micro").prop("disabled", false); // Réactivation du bouton micro
            $(".kh-button-stop").prop("disabled", true); // Désactivation du bouton stop
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
});
