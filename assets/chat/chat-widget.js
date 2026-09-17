// Widget de chat com a API Gemini.
// Depende de window.GEMINI_CONFIG, definido em assets/chat/config.js (não commitado).
(function () {
  const config = window.GEMINI_CONFIG || {};
  const apiKey = config.apiKey || "";
  const model = config.model || "gemini-3.6-flash";

  function buildWidget() {
    const wrapper = document.createElement("div");
    wrapper.id = "chat-widget";
    wrapper.innerHTML = `
      <div id="chat-panel" hidden>
        <div id="chat-header">Assistente Squad B</div>
        <div id="chat-messages"></div>
        <form id="chat-form">
          <input id="chat-input" type="text" placeholder="Digite sua mensagem..." autocomplete="off" />
          <button type="submit">Enviar</button>
        </form>
      </div>
      <button id="chat-toggle" type="button" aria-label="Abrir chat">💬</button>
    `;
    document.body.appendChild(wrapper);
    return wrapper;
  }

  function addMessage(container, text, role) {
    const msg = document.createElement("div");
    msg.className = "chat-msg chat-msg--" + role;
    msg.textContent = text;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    return msg;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function callGemini(question) {
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      encodeURIComponent(model) +
      ":generateContent?key=" +
      encodeURIComponent(apiKey);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: question }] }],
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const apiMessage = data?.error?.message;
      const error = new Error(apiMessage || "Falha ao consultar o Gemini (HTTP " + response.status + ")");
      error.status = response.status;
      throw error;
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || "Não consegui gerar uma resposta.";
  }

  // O modelo do Gemini às vezes responde 503 ("high demand") em picos de uso.
  // Tenta de novo uma vez após uma pequena espera antes de mostrar erro ao usuário.
  async function askGemini(question) {
    try {
      return await callGemini(question);
    } catch (error) {
      if (error.status === 503) {
        await wait(1500);
        return await callGemini(question);
      }
      throw error;
    }
  }

  function init() {
    const wrapper = buildWidget();
    const toggle = wrapper.querySelector("#chat-toggle");
    const panel = wrapper.querySelector("#chat-panel");
    const messages = wrapper.querySelector("#chat-messages");
    const form = wrapper.querySelector("#chat-form");
    const input = wrapper.querySelector("#chat-input");

    if (!apiKey) {
      addMessage(
        messages,
        "Chatbot ainda não configurado. Copie assets/chat/config.example.js para assets/chat/config.js e informe sua API key do Gemini.",
        "system"
      );
    }

    toggle.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      wrapper.classList.toggle("chat-open", !panel.hidden);
      if (!panel.hidden) input.focus();
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const question = input.value.trim();
      if (!question) return;

      if (!apiKey) {
        addMessage(messages, "Configure a API key em assets/chat/config.js antes de usar o chat.", "system");
        return;
      }

      addMessage(messages, question, "user");
      input.value = "";
      const submitButton = form.querySelector("button");
      submitButton.disabled = true;
      const typingMsg = addMessage(messages, "Digitando...", "system");

      try {
        const answer = await askGemini(question);
        typingMsg.remove();
        addMessage(messages, answer, "bot");
      } catch (error) {
        typingMsg.remove();
        addMessage(messages, "Erro ao falar com o Gemini: " + error.message, "system");
      } finally {
        submitButton.disabled = false;
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
