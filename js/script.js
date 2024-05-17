// Encapsulation dans jQuery(document).ready pour garantir que le script s'exécute après le chargement complet du DOM
jQuery(document).ready(function ($) {
  // Vérifier s'il existe une position de défilement enregistrée
  // const savedScrollPosition = localStorage.getItem("scrollPosition");
  // if (savedScrollPosition) {
  //   window.scrollTo(0, parseInt(savedScrollPosition, 10));
  //   // Supprimer la position de défilement enregistrée après restauration
  //   localStorage.removeItem("scrollPosition");
  // }

  // Utiliser setTimeout pour décaler le défilement jusqu'à ce que tout soit chargé
  // setTimeout(function () {
  //   window.scrollTo(0, document.body.scrollHeight);
  // }, 100);

  function checkSession() {
    if (!localStorage.getItem("jwt")) {
      // Si l'utilisateur n'est pas connecté, ne pas vérifier la session
      return;
    }
    $.ajax({
      url: "https://kokuauhane-071dbd833182.herokuapp.com/check_session",
      method: "GET",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("jwt"),
      },
      timeout: 5000, // Définir un délai d'attente de 5 secondes
      success: function (response) {
        if (!response.logged_in) {
          alert("Votre session a expiré. Veuillez vous reconnecter.");
          localStorage.removeItem("jwt");
          localStorage.removeItem("displayName");
          updateUI();
        }
      },
      error: function (xhr, status, error) {
        if (status === "timeout") {
          alert(
            "Le serveur est actuellement inactif. Veuillez réessayer plus tard."
          );
        } else {
          alert("Votre session a expiré. Veuillez vous reconnecter.");
        }
        localStorage.removeItem("jwt");
        localStorage.removeItem("displayName");
        updateUI();
      },
    });
  }

  // Appeler la fonction checkSession toutes les 5 minutes
  setInterval(checkSession, 300000); // 300000 ms = 5 minutes

  // Utiliser setTimeout pour décaler le défilement jusqu'à ce que tout soit chargé
  // setTimeout(function () {
  //   window.scrollTo(0, document.body.scrollHeight);
  // }, 100);

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
    // $(".kh-input").focus();
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

  // Fonction pour afficher la modal
  function showModal(message, event, confirmCallback, cancelCallback) {
    const modal = $("#confirmationModal");
    modal.find(".modal-message").text(message);
    modal.show();

    // Gestion des clics sur les boutons de la modal
    modal
      .find(".confirm-button")
      .off("click")
      .on("click", function () {
        confirmCallback(event);
        modal.hide();
      });

    modal
      .find(".cancel-button")
      .off("click")
      .on("click", function () {
        cancelCallback();
        modal.hide();
      });

    modal
      .find(".close-button")
      .off("click")
      .on("click", function () {
        modal.hide();
      });

    // Fermer la modal si l'utilisateur clique en dehors de celle-ci
    $(window).on("click", function (event) {
      if ($(event.target).is(modal)) {
        modal.hide();
      }
    });
  }

  // Envoi d'une requête POST avec le texte reconnu ou saisi
  $(".kh-button-send").click(function () {
    var inputText = $(".kh-input").val();
    $(".loading-indicator").addClass("active");
    $.ajax({
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
            success: function (confirmResponse) {
              $(".kh-response").html(
                "<div class='message-block'>Événement confirmé.</div>"
              );

              // Ajouter l'événement directement dans la liste
              addEventToDOM("Aujourd'hui", confirmResponse.event);

              // Recharger les événements depuis le serveur
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

        $(".kh-input").val("");
        // window.scrollTo(0, document.body.scrollHeight);

        if (isMicrophoneUsed) {
          let utterance = new SpeechSynthesisUtterance(response.response);
          utterance.onend = function () {
            toggleRecognition(true); // Réactivation de la reconnaissance vocale après la fin de la synthèse
            $(".kh-button-micro").prop("disabled", false); // Réactivation du bouton micro
            $(".kh-button-stop").prop("disabled", true); // Désactivation du bouton stop
            $(".listening-indicator").removeClass("active");
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

  // Fonction pour ajouter un événement au DOM
  function addEventToDOM(day, eventDescription) {
    let sectionHtml = `<div class='action-item' data-event-id="new">
    <button class="add-to-favorites"><i class='fa fa-heart'></i></button>
    <div class="event-description">${eventDescription}</div>
    <div class="edit-delete">
      <button class="edit-event"><i class='fa fa-pencil'></i></button>
      <button class="delete-event"><i class='fa fa-trash'></i></button>
    </div>
  </div>`;

    // Vérifier si une section "Aujourd'hui" existe déjà
    let todaySection = $(".day-title:contains('Aujourd\\'hui')").parent();
    if (todaySection.length) {
      todaySection.append(sectionHtml);
    } else {
      $(".kh-list").prepend(
        `<div class='day-section'><div class='day-title'>Aujourd'hui</div>${sectionHtml}</div>`
      );
    }
  }

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
          let days = ["Aujourd'hui", "Hier", "Avant-Hier"];
          for (let i = 0; i < days.length; i++) {
            let day = days[i];
            if (data[day].length) {
              let sectionHtml = `<div class='day-section'>
              <div class='day-title' data-toggle='${
                i === 0 ? "open" : "closed"
              }'>${day}</div>
              <div class='actions-list' style='display: ${
                i === 0 ? "block" : "none"
              };'>`;
              for (let j = data[day].length - 1; j >= 0; j--) {
                let event = data[day][j];
                let heartClass = event.isFavorite
                  ? "fa fa-heart filled"
                  : "fa fa-heart";
                sectionHtml += `<div class='action-item' data-event-id="${event.id}">
                <button class="add-to-favorites"><i class='${heartClass}'></i></button>
                <div class="event-description">${event.description}</div>
                <div class="edit-delete">
                  <button class="edit-event"><i class='fa fa-pencil'></i></button>
                  <button class="delete-event"><i class='fa fa-trash'></i></button>
                </div>
              </div>`;
              }
              sectionHtml += "</div></div>";
              $(".kh-list").append(sectionHtml);
            }
          }
          attachButtonListeners();
          attachAccordionListeners();
        }
      },
      error: function () {
        $(".kh-list").html(
          "<p>Erreur lors du chargement des actions. Veuillez réessayer plus tard.</p>"
        );
      },
    });
  }

  function attachAccordionListeners() {
    $(".day-title").click(function () {
      const toggleState = $(this).data("toggle");
      if (toggleState === "closed") {
        $(".actions-list").slideUp(); // Close all sections
        $(".day-title").data("toggle", "closed"); // Reset toggle state
        $(this).next(".actions-list").slideDown(); // Open the clicked section
        $(this).data("toggle", "open"); // Set toggle state to open
      }
    });
  }

  // Fonction pour ajouter des écouteurs d'événements click aux boutons
  function attachButtonListeners() {
    // Supprimer d'abord les écouteurs précédents pour éviter les déclenchements multiples
    $(".kh-list").off("click", ".action-item .edit-delete .fa-pencil");
    $(".kh-list").on(
      "click",
      ".action-item .edit-delete .fa-pencil",
      function () {
        let eventId = $(this).closest(".action-item").data("eventId");
        let eventDescription = $(this)
          .closest(".action-item")
          .find(".event-description")
          .text();
        editEvent(eventId, eventDescription);
      }
    );

    $(".kh-list").off("click", ".action-item .edit-delete .fa-trash");
    $(".kh-list").on(
      "click",
      ".action-item .edit-delete .fa-trash",
      function () {
        let eventId = $(this).closest(".action-item").data("eventId");
        deleteEvent(eventId);
      }
    );

    $(".kh-list").off("click", ".add-to-favorites .fa-heart");
    $(".kh-list").on("click", ".add-to-favorites .fa-heart", function () {
      let eventId = $(this).closest(".action-item").data("eventId");
      let isFilled = $(this).hasClass("filled");
      if (isFilled) {
        removeFromFavorites(eventId, $(this));
      } else {
        addToFavorites(eventId, $(this));
      }
    });
  }

  function addToFavorites(eventId, heartIcon) {
    $.ajax({
      url: `https://kokuauhane-071dbd833182.herokuapp.com/add_to_favorites/${eventId}`,
      method: "POST",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("jwt"),
      },
      success: function (response) {
        alert("Added to favorites!");
        heartIcon.addClass("filled");
      },
      error: function () {
        alert("Error adding to favorites.");
      },
    });
  }

  function removeFromFavorites(eventId, heartIcon) {
    $.ajax({
      url: `https://kokuauhane-071dbd833182.herokuapp.com/remove_from_favorites/${eventId}`,
      method: "POST",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("jwt"),
      },
      success: function (response) {
        alert("Removed from favorites!");
        heartIcon.removeClass("filled");
      },
      error: function () {
        alert("Error removing from favorites.");
      },
    });
  }

  function deleteEvent(eventId) {
    // Afficher une boîte de dialogue de confirmation
    if (confirm("Êtes-vous sûr de vouloir supprimer cette action ?")) {
      $.ajax({
        url: `https://kokuauhane-071dbd833182.herokuapp.com/delete_event/${eventId}`,
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("jwt"),
        },

        success: function (response) {
          alert("Action supprimée !");
          // localStorage.setItem(
          //   "scrollPosition",
          //   window.scrollY || document.documentElement.scrollTop
          // );
          location.reload();
        },
        error: function () {
          alert("Error deleting event.");
        },
      });
    } else {
      // Si l'utilisateur annule, vous pouvez ajouter une action ici, par exemple :
      console.log("Action supprimée.");
    }
  }

  function editEvent(eventId, currentDescription) {
    const newDescription = prompt(
      "Enter the new description for the event:",
      currentDescription
    );
    if (newDescription !== null) {
      $.ajax({
        url: `https://kokuauhane-071dbd833182.herokuapp.com/update_event/${eventId}`,
        method: "POST",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("jwt"),
        },
        contentType: "application/json",
        data: JSON.stringify({ description: newDescription }),
        success: function (response) {
          alert("Action mise à jour !");
          location.reload(); // Refresh the page to show the updated list
        },
        error: function () {
          alert("Error updating event.");
        },
      });
    }
  }
});
