jQuery(document).ready(function ($) {
  $(".kh-button-send").click(function () {
    var inputText = $(".kh-input").val(); // Récupère le texte de la zone de texte
    $.ajax({
      url: "https://kokuauhane-071dbd833182.herokuapp.com/ask", // Remplacez par l'URL de votre application Heroku
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({ question: inputText }),
      success: function (response) {
        $(".kh-response").html(response.response); // Affiche la réponse dans la div de réponse
        $(".kh-input").val(""); // Efface la zone de texte après l'envoi
      },
      error: function () {
        $(".kh-response").html(
          "Erreur lors de la communication avec le serveur."
        );
      },
    });
  });

  $(".kh-button-stop").click(function () {
    $(".kh-input").val(""); // Efface la zone de texte
    $(".kh-response").html(""); // Efface la réponse
  });
});
