// making ws variable available in the top level scope
let ws;
let password = localStorage.getItem("password");
if (!password) {
  password = prompt("Enter your cassidy password.");
  localStorage.setItem("password", password);
}

const emojis = ["💜", "😆", "😮", "🥲", "😭", "👍"];
/* create MAX_PROPERTIES variable.

higher = saves more messages.
higher = more pain for browsers.

*/
const MAX_PROPERTIES = 200;

// I'm lazy so I made this, it automatically saves and load localStorage items.
// It's the one responsible for message info.
const infos = new Proxy(
  {},
  {
    get(_, prop) {
      return JSON.parse(localStorage.getItem("infos") || "{}")[prop];
    },
    set(_, prop, value) {
      const storedInfos = JSON.parse(localStorage.getItem("infos") || "{}");

      if (Object.keys(storedInfos).length >= MAX_PROPERTIES) {
        const oldestProp = Object.keys(storedInfos)[0];
        delete storedInfos[oldestProp];
      }

      storedInfos[prop] = value;
      localStorage.setItem("infos", JSON.stringify(storedInfos));
      return true;
    },
  }
);

// Simple, load the convo as array.
function loadConvo() {
  const convo = JSON.parse(localStorage.getItem("convo") || "[]");
  return convo;
}

// window.onload always execute when the page loads..
window.onload = async () => {
  const reactOpt = document.querySelector("#reactOpt");

  //const reactOptions = document.querySelector("#reactOptions");
  for (const emoji of emojis) {
    reactOpt.innerHTML += `<span onclick="sendReact('${emoji}', '%1')"${emoji}</span>`;
  }
  /*const {
    data: { url },
  } = await axios.get("/ws-url");*/

  function scrollA(e) {
    if (isScrolledBottom(e, 20)) {
      smoothScroll2(e);
    }
  }

  function loadWs() {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws`);
  }

  loadWs();
  const ccc = document.querySelector("#ccc");
  // You can freely customize this ws.onopen, just make sure it doesn't do stuffs that may break the page :)

  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        type: "login",
        password,
      })
    );
  };
  ws.onmessage = (i) => {
    const data = JSON.parse(i.data);
    switch (data.type) {
      case "login_failure":
        localStorage.removeItem("password");
        break;
      case "message":
        handleMessage(data);
        smoothScroll2(ccc);
        break;
      case "message_reply":
        handleMessage(data);
        smoothScroll2(ccc);
        break;
      case "message_edit":
        handleMessageEdit(data);
        scrollA(ccc);
        break;
    }
  };
  ws.onclose = () => {
    window.location.href = window.location.href;
    // Lmao refresh
    // appendSend({
    //   message: "[ Restarting Connection... ]",
    //   chatPad,
    // });
    // loadWs();
    // ws.addEventListener("open", () => {
    //   appendSend({
    //     message: "[ Connection restarted! ]",
    //     chatPad,
    //   });
    // });
  };
  // Get the chatPad, I don't want to type it every time lmao
  const chatPad = document.getElementById("chatPad");
  // remember the loadConvo function?
  const convo = loadConvo();
  convo.forEach((c) => {
    if (c.message) {
      // Just iterate the shit
      return appendSend({ message: c.message, chatPad });
    }
    // if the message is from bot..
    return appendRep({ body: c.body, messageID: c.messageID, chatPad });
  });
  // After a lot of appending, we gonna scroll the entire page.
  smoothScroll2(ccc);
};
function pushConvo(data) {
  const convo = loadConvo();

  convo.push(data);

  if (convo.length > MAX_PROPERTIES) {
    convo.splice(0, convo.length - MAX_PROPERTIES);
  }
  // This thing saves the convo automatically, and ofc filter the length using the MAX_PROPERTIES, but the length only applies every refresh..

  localStorage.setItem("convo", JSON.stringify(convo));
}
function localEdit(message, messageID) {
  // Self explanatory, save edit changes to your browser
  let convo = loadConvo();
  for (const index in convo) {
    const { messageID: targetID } = convo[index];
    if (messageID === targetID) {
      convo[index].body = message;
    }
  }
  localStorage.setItem("convo", JSON.stringify(convo));
}
// I'm lazy to explain these all, but this one applies the edit changes to the message, uhh how the hell do i explain it, it just applies the edit message data sent by websocket
function handleMessageEdit({ messageID, body }) {
  const doc = document.querySelector(`#${messageID}_text`);
  if (!doc) {
    return;
  }
  doc.innerText = body;
  localEdit(body, messageID);
}
// This one is responsible for appending replies from bot
function appendRepOld({ body, messageID, chatPad }) {
  pushConvo({ body, messageID, chatPad });
  const elem = document.createElement("span");
  elem.innerHTML += `<div class="response-message-container" id="${messageID}_box"><div class="response-message" ><div onclick="togOpt('${messageID}')" id="${messageID}_text" >${autoAnchor(
    sanitize(body)
  )}</div><span id="${messageID}_options" style="display: none;"><br><br><div class="vanillaButton bnw" onclick="xCopy('${messageID}'); ">Copy</div><br><div class="vanillaButton bnw" onclick="chooseReaction('${messageID}'); ">React</div><br><div class="vanillaButton bnw" onclick="reply('${messageID}')">Reply</div></span></div></div>`;
  chatPad.appendChild(elem);
  animateSend(elem);
}

function appendRep({ body, messageID, chatPad }) {
  if (chatPad instanceof HTMLElement) {
    pushConvo({ body, messageID, chatPad });
    const messageContainer =
      chatPad.lastElementChild &&
      chatPad.lastElementChild &&
      chatPad.lastElementChild.classList.contains("response-message-container")
        ? chatPad.lastElementChild
        : document.createElement("div");
    messageContainer.classList.add("response-message-container");

    if (messageContainer instanceof HTMLElement) {
      const userMessage = document.createElement("div");
      userMessage.classList.add("response-message");
      const wrapper = messageContainer.querySelector(".col-response-message")
        ? messageContainer.querySelector(".col-response-message")
        : document.createElement("div");
      wrapper.classList.add("col-response-message");
      userMessage.textContent = body;
      userMessage.id = `${messageID}_text`;
      if (isEmojiAll(body)) {
        userMessage.classList.add("emoji-only");
      }
      wrapper.append(userMessage);
      messageContainer.append(wrapper);

      chatPad.appendChild(messageContainer);
      animateSend(userMessage);
      chatPad.addEventListener("scroll", () => {
        ctxmenu.hide();
      });
      let cloneS = null;
      let blurS = null;
      let reS = null;
      const ctxmenu = new ContextMenu(userMessage, {
        onOpen(event) {
          userMessage.style.pointerEvents = "none";
          const rect1 = userMessage.getBoundingClientRect();
          ctxmenu.menu.style.width = `${rect1.width}px`;
          userMessage.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          const blur = document.createElement("div");
          blur.classList.add("blur-bg");
          blur.addEventListener("click", () => {
            ctxmenu.hide();
          });
          const reactOpt = document.createElement("div");
          reactOpt.classList.add("react-c");
          reS = reactOpt;

          reactOpt.innerHTML = "";
          for (const emoji of emojis) {
            reactOpt.innerHTML += `<span onclick="sendReact('${emoji}', '${messageID}')" style="font-size: 30px;">${emoji}</span>  `;
          }

          blurS = blur;
          setTimeout(() => {
            const rect = userMessage.getBoundingClientRect();
            ctxmenu.show({
              clientY: rect.bottom + 20,
              clientX: rect.left,
            });

            const clone = userMessage.cloneNode(true);
            if (clone instanceof HTMLElement) {
              clone.classList.add("center-fixed");
              clone.style.left = rect.left + "px";
              clone.style.right = rect.right + "px";
              clone.style.top = rect.top + "px";
              clone.style.bottom = rect.bottom + "px";
              clone.style.width = rect.width + "px";
              clone.style.height = rect.height + "px";

              reactOpt.disabled = false;

              reactOpt.style.left = rect.left + "px";
              reactOpt.style.right = rect.right + "px";
              // reactOpt.style.bottom = rect.bottom + "px";

              document.body.appendChild(clone);
              document.body.appendChild(reactOpt);
              // reactOpt.style.top = event.clientY - reactOpt.clientHeight + "px";

              let newTop = rect.top - reactOpt.clientHeight - 20;
              let alternativeTop = event.clientY - reactOpt.clientHeight;

              if (newTop < 0) {
                newTop = alternativeTop;
              } else if (newTop + reactOpt.clientHeight > window.innerHeight) {
                newTop = window.innerHeight - reactOpt.clientHeight;
              }

              reactOpt.style.top = `${newTop}px`;

              cloneS = clone;
            }
            document.body.appendChild(blur);
          }, 300);
        },
        onClose() {
          if (cloneS instanceof HTMLElement) {
            cloneS.remove();
          }
          if (blurS instanceof HTMLElement) {
            blurS.remove();
          }
          userMessage.style.pointerEvents = "";
          if (reS instanceof HTMLElement) {
            reS.remove();
          }
        },
        items: [
          // {
          //   label: "React",
          //   svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M800-680v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80ZM620-520q25 0 42.5-17.5T680-580q0-25-17.5-42.5T620-640q-25 0-42.5 17.5T560-580q0 25 17.5 42.5T620-520Zm-280 0q25 0 42.5-17.5T400-580q0-25-17.5-42.5T340-640q-25 0-42.5 17.5T280-580q0 25 17.5 42.5T340-520Zm140 260q68 0 123.5-38.5T684-400H276q25 63 80.5 101.5T480-260Zm0 180q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q43 0 83 8.5t77 24.5v167h80v80h142q9 29 13.5 58.5T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/></svg>`,
          //   async callback() {
          //     chooseReaction(messageID);
          //   },
          // },
          {
            label: "Reply",
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M760-200v-160q0-50-35-85t-85-35H273l144 144-57 56-240-240 240-240 57 56-144 144h367q83 0 141.5 58.5T840-360v160h-80Z"/></svg>`,
            async callback() {
              reply(messageID);
            },
          },
          {
            label: "Copy",
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M160-40q-33 0-56.5-23.5T80-120v-560h80v560h440v80H160Zm160-160q-33 0-56.5-23.5T240-280v-560q0-33 23.5-56.5T320-920h280l240 240v400q0 33-23.5 56.5T760-200H320Zm240-440h200L560-840v200Z"/></svg>`,
            async callback() {
              await navigator.clipboard.writeText(body);
            },
          },
        ],
        allowance: 20,
        bottom: true,
      });

      ctxmenu.init();
    }
  }
}

// some stuffs don't need to be documented
function togOpt(messageID) {
  const elem = document.querySelector(`#${messageID}_options`);
  if (elem.style.display !== "none") {
    elem.style.display = "none";
  } else {
    elem.style.display = "block";
  }
}
function xCopy(id) {
  copyToClipboard(document.querySelector(`#${id}_text`).innerText);
}
// this one also appends but it's a little different one, it appends messages sent by YOU
function appendSendOld({ message, chatPad }) {
  const elem = document.createElement("span");
  pushConvo({ message });
  elem.innerHTML += `<div class="user-message-container"><div class="user-message">${autoAnchor(
    sanitize(message)
  )}</div></div>`;
  chatPad.appendChild(elem);
  animateSend(elem);
}

function appendSend({ message, chatPad }) {
  if (chatPad instanceof HTMLElement) {
    pushConvo({ message });
    const messageContainer =
      chatPad.lastElementChild &&
      chatPad.lastElementChild &&
      chatPad.lastElementChild.classList.contains("user-message-container")
        ? chatPad.lastElementChild
        : document.createElement("div");
    messageContainer.classList.add("user-message-container");

    if (messageContainer instanceof HTMLElement) {
      const userMessage = document.createElement("div");
      userMessage.classList.add("user-message");
      const wrapper = messageContainer.querySelector(".col-user-message")
        ? messageContainer.querySelector(".col-user-message")
        : document.createElement("div");
      wrapper.classList.add("col-user-message");
      userMessage.textContent = message;
      if (isEmojiAll(message)) {
        userMessage.classList.add("emoji-only");
      }
      wrapper.append(userMessage);
      messageContainer.append(wrapper);

      chatPad.appendChild(messageContainer);
      animateSend(userMessage);
      chatPad.addEventListener("scroll", () => {
        ctxmenu.hide();
      });
      let cloneS = null;
      let blurS = null;

      const ctxmenu = new ContextMenu(userMessage, {
        onOpen() {
          userMessage.style.pointerEvents = "none";
          const rect1 = userMessage.getBoundingClientRect();
          ctxmenu.menu.style.width = `${rect1.width}px`;
          userMessage.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          const blur = document.createElement("div");
          blur.classList.add("blur-bg");
          blur.addEventListener("click", () => {
            ctxmenu.hide();
          });
          blurS = blur;
          setTimeout(() => {
            const rect = userMessage.getBoundingClientRect();
            ctxmenu.show({
              clientY: rect.bottom + 20,
              clientX: rect.right - rect.width,
              // isRight: true,
            });

            const clone = userMessage.cloneNode(true);
            if (clone instanceof HTMLElement) {
              clone.classList.add("center-fixed");
              clone.style.left = rect.left + "px";
              clone.style.right = rect.right + "px";
              clone.style.top = rect.top + "px";
              clone.style.bottom = rect.bottom + "px";
              clone.style.width = rect.width + "px";
              clone.style.height = rect.height + "px";

              document.body.appendChild(clone);
              cloneS = clone;
            }
            document.body.appendChild(blur);
          }, 300);
        },
        onClose() {
          if (cloneS instanceof HTMLElement) {
            cloneS.remove();
          }
          if (blurS instanceof HTMLElement) {
            blurS.remove();
          }
          userMessage.style.pointerEvents = "";
        },
        items: [
          {
            label: "React",
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M800-680v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80ZM620-520q25 0 42.5-17.5T680-580q0-25-17.5-42.5T620-640q-25 0-42.5 17.5T560-580q0 25 17.5 42.5T620-520Zm-280 0q25 0 42.5-17.5T400-580q0-25-17.5-42.5T340-640q-25 0-42.5 17.5T280-580q0 25 17.5 42.5T340-520Zm140 260q68 0 123.5-38.5T684-400H276q25 63 80.5 101.5T480-260Zm0 180q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q43 0 83 8.5t77 24.5v167h80v80h142q9 29 13.5 58.5T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/></svg>`,
            async callback() {
              chooseReaction(messageID);
            },
          },

          {
            label: "Copy",
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M160-40q-33 0-56.5-23.5T80-120v-560h80v560h440v80H160Zm160-160q-33 0-56.5-23.5T240-280v-560q0-33 23.5-56.5T320-920h280l240 240v400q0 33-23.5 56.5T760-200H320Zm240-440h200L560-840v200Z"/></svg>`,
            async callback() {
              await navigator.clipboard.writeText(message);
            },
          },
        ],
        allowance: 20,
        bottom: true,
      });

      ctxmenu.init();
    }
  }
}

// this handles messages sent by user/bot
function handleMessage(data) {
  const chatPad = document.getElementById("chatPad");
  if (data.messageID) {
    infos[data.messageID] = data;
  }
  if (data.botSend) {
    appendRep({ body: data.body, messageID: data.messageID, chatPad });
  } else {
    let appended = data.body;
    if (data.messageReply) {
      const { body } = infos[data.messageReply.messageID] || {};
      appended = `Replying to: ${limitStr(body, 10)}

${data.body}`;
    }

    appendSend({ message: appended, chatPad });
  }
}

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey) {
    return;
  }
  const messageDoc = document.querySelector("#userText");
  messageDoc.focus();
});

document.addEventListener("keydown", function (event) {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    send();
  }
});

// this one is for sending messages..
async function send(isReply, mid, extra = {}) {
  const messageDoc = document.querySelector("#userText");

  const message = messageDoc.value.trim();
  if (!message) {
    return alert(
      `You can't send an empty message, please type at the textarea first.`
    );
  }
  let payload = {
    params: {
      body: message,
      messageReply: isReply ? { ...infos[mid] } : null,
      type: isReply ? "message_reply" : "message",
      ...extra,
    },
  };
  ws.send(JSON.stringify(payload.params));

  messageDoc.value = "";
  adjustRows();
}
function chooseReaction(messageID) {
  const reactOpt = document.querySelector("#reactOpt");
  const reactBG = document.querySelector("#reactBG");

  const reactOptions = document.querySelector("#reactOptions");
  reactOptions.innerHTML = "";
  for (const emoji of emojis) {
    reactOptions.innerHTML += `<span onclick="sendReact('${emoji}', '${messageID}')" style="font-size: 30px;">${emoji}</span>  `;
  }
  reactOpt.style.display = "block";
  reactOpt.disabled = false;
  reactBG.style.display = "block";
  reactBG.disabled = false;
}
function sendReact(reaction, messageID) {
  ws.send(
    JSON.stringify({
      type: "message_reaction",
      reaction,
      messageID,
    })
  );
}
// this one is the oldest cassidy send function, and it sucks but t faster
async function sendOld(isReply, mid, extra = {}) {
  const message = document.getElementById("userText").value?.trim();
  if (!message) {
    return alert(
      `You can't send an empty message, please type at the textarea first.`
    );
  }
  const chatPad = document.getElementById("chatPad");
  document.getElementById("userText").value = "";
  try {
    let appended = message;
    if (isReply) {
      const { body } = infos[mid];
      appended = `Replying to: ${limitStr(body, 10)}

${message}`;
    }
    let payload = {
      params: {
        body: message,
        messageReply: isReply ? { ...infos[mid] } : null,
        type: isReply ? "message_reply" : "message",
        ...extra,
      },
    };
    const emojis = ["👍", "❤️", "😮", "😢", "😠", "👎"];
    if (isReply && emojis.includes(message)) {
      const { messageID, body } = infos[mid];
      appended = `Reacting to ${limitStr(body, 10)}

${message}`;
      payload = {
        params: {
          type: "message_reaction",
          messageID,
          reaction: message,
          userID: 1,
          ...extra,
        },
      };
    }
    appendSend({ message: appended, chatPad });
    smoothScroll();
    const response = await axios.get(`/postWReply`, payload);
    const {
      result,
      result: { body, messageID },
    } = response.data;
    infos[messageID] = result;
    appendRep({ messageID, body, chatPad });
    smoothScroll();
  } catch (err) {
    console.error(err);
  }
}
// Liane ain't documenting these all
async function reply(mid) {
  await send(true, mid);
}
// self explanatory, avoid xss even tho not needed very much since nobody else can chat together..
function sanitize(input) {
  const sanitizedInput = input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const sanitizedWithLineBreaks = sanitizedInput.replace(/\n/g, "<br>");

  return sanitizedWithLineBreaks;
}

const textarea = document.getElementById("userText");
const MAX_ROWS = 7;
function adjustRows() {
  const lines = textarea.value.split("\n");
  const rowCount = Math.min(lines.length, MAX_ROWS);

  textarea.setAttribute("rows", rowCount);

  const ccc = document.querySelector("#ccc");
  if (isScrolledBottom(ccc, 20)) {
    ccc.lastElementChild.scrollIntoView({ behavior: "smooth" });
  }
}

function animateSend(element) {
  if (element instanceof HTMLElement) {
    element.animate(
      [
        {
          transform: "translateY(20px)",
          opacity: 0,
        },
        {
          transform: "translateY(0)",
          opacity: 1,
        },
      ],
      {
        duration: 300,
        easing: "ease-out",
      }
    );
  }
}

textarea.addEventListener("input", adjustRows);

function isScrolledBottom(element, allowance) {
  if (!element) return false;

  if (element instanceof HTMLElement) {
    const scrollPosition = element.scrollTop + element.clientHeight;
    const scrollHeight = element.scrollHeight;

    console.log(
      `${scrollPosition} >= ${scrollHeight} - ${allowance} (${
        scrollHeight - allowance
      })`,
      scrollPosition >= scrollHeight - allowance
    );

    return scrollPosition >= scrollHeight - allowance;
  }

  return false;
}

function isEmojiAll(str) {
  const regex = /^\p{Emoji}+$/u;
  return regex.test(str.replace(/\n/g, "").replace(" ", ""));
}

/**
 * ContextMenu class for creating customizable and dynamic context menus.
 *
 * @author Liane Cagara
 */
class ContextMenu {
  static cache = [];
  /**
   * Creates a new ContextMenu instance.
   *
   * @param {HTMLElement} element - The target element to attach the context menu to.
   * @param {{
   *   menu?: HTMLElement,
   *   bottom?: boolean,
   *   allowance?: number,
   *   clean?: boolean,
   *   leftClick?: boolean,
   *   items?: Array<{ label: string, callback: Function }>
   *   onOpen: Function,
   *   onClose: Function
   * }} [options] - Options to customize the context menu.
   */
  constructor(
    element,
    {
      menu,
      bottom,
      allowance = 0,
      items = [],
      clean = false,
      leftClick = false,
      onOpen,
      onClose,
    } = {}
  ) {
    this.leftClick = leftClick;
    this.target = element;
    this.clean = clean;
    if (!menu) {
      menu = document.createElement("div");
      menu.classList.add("lia-ctxmenu");
    }
    this.isBottom = !!bottom;
    this.menu = menu;
    this.allowance = allowance;
    this.items = items;
    this.visible = false;
    this.onOpen = onOpen;
    this.isHovered = false;
    this.optionsElem = [];
    this.onClose = onClose;

    menu.addEventListener("mouseenter", () => {
      this.isHovered = true;
    });
    menu.addEventListener("mouseleave", () => {
      this.isHovered = false;
    });
  }

  /**
   * Adds an option to the context menu.
   *
   * @param {{
   *   label: string,
   *   callback: Function,
   *   [etc]: Object
   * }} option - The menu option to add.
   */
  addOption({ label, callback, svgIcon, ...etc }) {
    const e = document.createElement("div");
    e.classList.add("item");

    if (svgIcon) {
      const span = document.createElement("span");
      span.innerHTML = svgIcon;
      const txt = document.createElement("span");
      txt.textContent = label;
      e.addEventListener("click", (e) => {
        callback(e, this.target);
      });
      e.append(txt, span);
      e.style.display = "flex";
      e.style.gap = "10px";
      e.style.alignItems = "center";
      e.classList.add("menusvg");
      span.style.display = "flex";
    } else {
      e.textContent = label;
      e.addEventListener("click", (e) => {
        callback(e, this.target);
      });
    }

    Object.assign(e, etc);

    this.menu.appendChild(e);
    this.optionsElem.push(e);
  }

  /**
   * Clears all options from the context menu.
   */
  clearOptions() {
    this.menu.innerHTML = "";
    this.optionsElem = [];
  }

  /**
   * Removes a specific option from the context menu by label.
   *
   * @param {string} label - The label of the option to remove.
   */
  removeOption(label) {
    // const items = this.menu.querySelectorAll(".item");
    const items = this.optionsElem;
    for (const item of items) {
      if (item.textContent === label) {
        this.menu.removeChild(item);
        this.optionsElem.splice(this.optionsElem.indexOf(item), 1);
        break;
      }
    }
  }

  /**
   * Updates an existing option in the context menu.
   *
   * @param {string} oldLabel - The label of the option to update.
   * @param {{
   *   label: string,
   *   callback: Function,
   *   [etc]: Object
   * }} newOption - The new properties for the updated option.
   */
  updateOption(oldLabel, { label, callback, ...etc }) {
    const items = this.menu.querySelectorAll(".item");
    for (const item of items) {
      if (item.textContent === oldLabel) {
        item.textContent = label;
        item.onclick = (e) => callback(e, this.target);
        Object.assign(item, etc);
        break;
      }
    }
  }

  /**
   * Initializes the context menu and attaches necessary event listeners.
   */
  init() {
    if (!this.clean) {
      this.menu.classList.add("lia-ctxmenu");
    }
    Object.assign(this.menu.style, {
      position: "fixed",
      zIndex: "10000",
      display: "none",
      overflowY: "auto",
      maxHeight: "90vh",
    });
    const { target, menu } = this;
    for (const data of this.items) {
      this.addOption(data);
    }

    if (this.leftClick) {
      target.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.visible) {
          this.hide();
        } else {
          this.show(e);
        }
      });
      window.addEventListener("click", () => this.hide());
      window.addEventListener("contextmenu", () => this.hide());
      // target.addEventListener("contextmenu", (e) => {
      //   // e.stopPropagation();
      //   this.hide();
      // });
    } else if (!this.onOpen) {
      target.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.isHovered) {
          this.hide();
        } else {
          this.show(e);
        }
      });

      window.addEventListener("click", () => this.hide());
      window.addEventListener("contextmenu", () => this.hide());
    } else {
      target.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();

        this.onOpen(e);
      });
      window.addEventListener("click", () => this.hide());
      window.addEventListener("contextmenu", () => this.hide());
    }

    // Calibration
    this.show();
    this.menu.style.display = "none";
    this.visible = false;
    ContextMenu.cache.push(this);
  }

  /**
   * Hides the context menu with an animation.
   */
  hide() {
    this.menu.style.animation = "closeApp 0.2s ease-out forwards";

    setTimeout(() => {
      this.menu.style.animation = "";

      this.menu.style.display = "none";
      this.visible = false;
      if (this.onClose) {
        this.onClose();
      }
    }, 200);
  }

  /**
   * Displays the context menu at the specified position.
   *
   * @param {{ clientX?: number, clientY?: number }} [position] - The position to show the menu at.
   */
  show({ clientX = 0, clientY = 0, isRight = false } = {}) {
    const { menu, isBottom, allowance } = this;
    const { innerWidth, innerHeight } = window;
    this.menu.style.animation = "openApp 0.2s ease-out forwards";

    setTimeout(() => {
      this.menu.style.animation = "";
    }, 200);

    // Temporarily make the menu visible to calculate dimensions
    Object.assign(menu.style, {
      visibility: "hidden",
      display: "block",
    });

    if (this.leftClick) {
      const rect = this.target.getBoundingClientRect();
      clientX = rect.right - menu.clientWidth;
      clientY = rect.bottom;
    }

    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;

    // Hide it again until properly positioned
    Object.assign(menu.style, {
      visibility: "",
      display: "none",
    });

    let left = clientX;
    let top = clientY;

    // Handle bottom positioning logic
    if (isBottom) {
      const bottomSpace = innerHeight - clientY;

      if (menuHeight > bottomSpace) {
        top = innerHeight - menuHeight - allowance;
      } else {
        top = clientY;
      }

      Object.assign(menu.style, {
        bottom: `${innerHeight - top - menuHeight}px`,
        top: "unset",
      });
    } else {
      // Ensure the menu doesn't overflow the viewport vertically
      if (clientY + menuHeight > innerHeight) {
        top = innerHeight - menuHeight - allowance;
      }

      // Prevent menu from going off-screen on the top side
      if (top < 0) top = allowance;

      Object.assign(menu.style, {
        top: `${top}px`,
        bottom: allowance ? `${allowance}px` : "unset",
      });
    }

    if (!isRight) {
      if (clientX + menuWidth > innerWidth) {
        left = innerWidth - menuWidth - allowance;
      }
    }

    Object.assign(menu.style, {
      [isRight ? "right" : "left"]: `${left}px`,
      display: "flex",
    });

    if (isRight) {
      menu.style.left = "";
    }

    document.body.appendChild(menu);
    this.visible = true;
    for (const c of ContextMenu.cache) {
      if (c === this) {
        continue;
      }
      c.hide();
    }
  }
}
