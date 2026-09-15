// Envia o formulário de contato abrindo o cliente de e-mail do visitante
// com os campos já preenchidos (sem depender de nenhum backend/serviço terceiro).
(function () {
  var DESTINATARIO = "[PREENCHER: e-mail]";

  var form = document.getElementById("contato-form");
  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var nome = form.name.value.trim();
    var email = form.email.value.trim();
    var assunto = form.subject.value.trim();
    var mensagem = form.message.value.trim();

    var corpo =
      "Nome: " + nome + "\n" +
      "Email: " + email + "\n\n" +
      mensagem;

    var mailtoUrl =
      "mailto:" + encodeURIComponent(DESTINATARIO) +
      "?subject=" + encodeURIComponent(assunto || "Contato pelo site") +
      "&body=" + encodeURIComponent(corpo);

    window.location.href = mailtoUrl;
  });
})();
