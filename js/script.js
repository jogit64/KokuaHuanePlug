jQuery(document).ready(function ($) {
  let recognition;
  let synth = window.speechSynthesis;
  let isMicrophoneUsed = false;
  let isRecognizing = false;

  function toggleRecognition(shouldStart) {
    if (recognition) {
      if (shouldStart && !isRecognizing) {
        recognition.start();
        isRecognizing = true;
      } else {
        recognition.stop();
        isRecognizing = false;
      }
    }
  }

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

  $(".kh-button-micro").on("click", function () {
    toggleRecognition(true);
  });

  $(".kh-button-stop").on("click", function () {
    toggleRecognition(false);
    isMicrophoneUsed = false;

    if (synth.speaking) {
      synth.cancel();
    }
    $(this).prop("disabled", true);
  });

  $(".kh-button-send").click(function () {
    var inputText = $(".kh-input").val();
    $.ajax({
      url: "https://kokuauhane-071dbd833182.herokuapp.com/ask",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({ question: inputText }),
      success: function (response) {
        $(".kh-response").html(response.response);
        $(".kh-input").val("");
        if (isMicrophoneUsed) {
          toggleRecognition(false);

          let utterance = new SpeechSynthesisUtterance(response.response);
          utterance.onend = function () {
            if (isMicrophoneUsed) {
              toggleRecognition(true);
            }
            $(".kh-button-stop").prop("disabled", true);
          };
          synth.speak(utterance);
          $(".kh-button-stop").prop("disabled", false);
          isMicrophoneUsed = false;
        }
      },
      error: function () {
        $(".kh-response").html(
          "Erreur lors de la communication avec le serveur."
        );
      },
    });
  });

  $(".kh-input").on("input", function () {
    let textLength = $(this).val().length;
    $(".kh-button-send").prop("disabled", textLength === 0);
  });

  initializeRecognition();
  $(".kh-button-send").prop("disabled", $(".kh-input").val().length === 0);
  $(".kh-button-stop").prop("disabled", true);
});
