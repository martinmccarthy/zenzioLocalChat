//******************************************** */
//Copyright Zenzio Solutions, Inc. 2023
//All Rights Reserved
//Do not copy or distribute without permission
//******************************************** */

//** Namespace */

/*Version 3.2 DEMO - THIS IS UTILIZED FOR CHROME EXTENSION DEMONSTRATIONS */
var Zenzio = (function () {

    var self = {};

    //##Current_UTCTime##
    var ZenzioActiveChat = false;
    var ZenzioActiveInput = false;
    const ZenzioDoDebug = false;
    var LastmessageTime;

    var channelid = '21111111-1111-1111-1111-111111111111';
    var locationid = 'acefc356-d816-476d-848b-bfb3b6ef376a';
    var chatid;
    var vinid;
    var uniqueVins = new Set();

    var urlValues;

    /* TO DO: Remove global variables for  all the elements and their IDs and query them based on known ids instead */
    var ChatBugImageContainer;
    var ChatBugImage;
    var ChatContainer;
    var ChatTextCue;
    var ChatHeaderContainer;
    var ChatBox;
    var ChatWindow;
    var ChatInputContainer;
    var Chatinput;
    var ChatSendButton;
    var ChatExpanderContainer

    var ChatBugImageId;
    var ChatBugImageContainerId;
    var ChatTextCueId;
    var ChatTextCueInner;

    var TypeWriterText = "##TypeWriterEnabled##";
    var TypeWrtierActive = false;

    var AblyEnabled = false;
    var ably;
    var WelcomeMessage = '';
    var baseExpirationDate;
    const baseCookieName = "zenzio_chat_";

    var currUserIp = "";
    var clicksCount;
    var userMobile = false;

    /* Called once we load the script onto the page */
    self.doFirstLoad = function () {
        WelcomeMessage = 'Hello! How can I help you today?';
        ChatBugImageId = 'ZenzioChatBugIcon';
        ChatInputContainerId = 'ZenzioChatInputContainer';
        ChatBugImageContainerId = 'ZenzioChatBugIconContainer';
        ChatTextCueId = 'ZenzioChatTextCue';

        baseExpirationDate = new Date();
        baseExpirationDate.setUTCFullYear(baseExpirationDate.getUTCFullYear() + 1);
        userMobile = getClientDevice();
        urlValues = parseApiValuesFromUrl();

        writeOrUpdateCookie(baseCookieName + locationid + "_marker", locationid, baseExpirationDate);

        let clicksCookie = getCookie("clicksCount");
        clicksCount = clicksCookie ? parseInt(clicksCookie.split('=')[1]) : 0;
        if (isNaN(clicksCount)) {
            clicksCount = 0;
        }
        if (clicksCount >= 3) {
            clicksCount++;
        }
        try {
            WelcomeMessage = "##GREETING_MESSAGE##";

            if (WelcomeMessage == '') {
                WelcomeMessage = 'Hello! How can I help you today?';
            }
        } catch {
            WelcomeMessage = 'Hello! How can I help you today?';
        }

        try {
            if (TypeWriterText.toLowerCase() == 'true') {
                TypeWrtierActive = true;
            }
        }
        catch
        {
            TypeWrtierActive = false;
        }

        setTimeout(function () {
            setTimeout(function () {
                createChatDisplay();

                ChatBugImage.style.display = "block;"
                Chatinput.style.display = 'block';
                ChatTextCue.style.display = 'block';

                ChatTextCue.style.opacity = 0;
                ChatTextCue.style.transition = "opacity 1s ease-in-out";
                if (clicksCount >= 3) {
                    ChatTextCue.style.display = 'none';
                }

                ChatBugImageContainer.appendChild(ChatBugImage);
                ChatContainer.appendChild(ChatBugImageContainer);
                ChatContainer.appendChild(ChatTextCue);
                setBugLocation();
                GetVinData();
                displayTextCue();

            }, 700);
        }, 300);


        if ('##AUTO_OPEN_DELAY_MS##' > 0) {
            setTimeout(function () {
                var hasManuallyClosed = false;

                var cookieValue = getCookie(baseCookieName + locationid + "_manualclose");

                if (cookieValue === null || cookieValue === '') {

                    if (ZenzioActiveChat == false) {
                        OpenChat();
                    }
                }
            }, '##AUTO_OPEN_DELAY_MS##');
        }
    }

    self.resetChat = async function () {
        await ResetStorage();
        await CheckStorage();
        await loadChat();

        //delete the cookie
        deleteCookie(baseCookieName + locationid + "_marker");
        deleteCookie(baseCookieName + locationid + "_manualclose");

        //clear it
        Chatinput.value = "";
        Chatinput.innerHTML = "";
    }

    self.insertVin = function () {
        var VinDisplayContainer = document.createElement("div");
        VinDisplayContainer.style.maxWidth = "320px";
        VinDisplayContainer.style.border = "1px solid #ddd";
        VinDisplayContainer.style.borderRadius = "8px";
        VinDisplayContainer.style.overflow = "hidden";
        VinDisplayContainer.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
        VinDisplayContainer.style.margin = "20px";
        VinDisplayContainer.style.fontFamily = "Arial, sans-serif";

        let knownVin = "1GYKNAR47LZ230344";
        uniqueVins = [knownVin];

        var vinh1 = document.createElement("h1");
        vinh1.style.fontSize = "18px";
        vinh1.style.margin = "16px";
        vinh1.style.textAlign = "center";

        vinImg = document.createElement("img");
        vinImg.src = "https://vehicleimages.dealervision.com/Fitzgerald_Used_Car_Outlet_Center_Clearwater/RA30344/RA30344_1.jpg";

        vinImg.style.maxWidth = "100%";
        vinImg.style.height = "auto";
        vinImg.style.borderBottom = "1px solid #ddd";

        checkInventory().then(data => {
            if (data.length > 0) {
                var textCue = document.querySelector('.zenzioTextCue');
                var innerCue = document.querySelector('.zenzioTextCueInner');
                textCue.style.display = 'block';
                vinh1.innerHTML = `${data[0].year} ${data[0].make} ${data[0].model}`;
                VinDisplayContainer.appendChild(vinh1);
                VinDisplayContainer.appendChild(vinImg);
                ChatTextCueInner.innerHTML = buildWelcomeString(data[0]);
                vinFound = true;
                vinid = knownVin;
                WelcomeMessage = buildWelcomeString(data[0]);
                var contentHeight;
                if (typeof innerCue.height !== 'undefined') {
                    contentHeight = parseInt(innerCue.height) + 20;
                } else {
                    contentHeight = parseInt(innerCue.clientHeight) + 20;
                }
                textCue.style.height = contentHeight + 'px';
                displayTextCue();
            }
        });
        document.body.insertBefore(VinDisplayContainer, document.body.firstChild);
    }

    function displayTextCue() {
        setTimeout(function () {
            ChatTextCue.style.opacity = 1;
            setTimeout(function () {
                if (ChatTextCue.style.display != 'none') {
                    ChatTextCue.style.opacity = 0;
                    setTimeout(function () {
                        ChatTextCue.style.display = 'none';
                    }, 1000);
                    ChatTextCue.pointerEvents = 'none';
                }
            }, 9000);
        }, 1000);
    }

    function setBugLocation() {
        var selectedBugLocation = '##BUG_LOCATION##'
        var chatBug = document.getElementById('ZenzioChatBugIconContainer');
        var textCue = document.getElementById('ZenzioChatTextCue');
        var innerCue = document.getElementById('ZenzioTextCueInner');

        switch (selectedBugLocation) {
            case "bottomleft":
                chatBug.style.bottom = "10px";
                chatBug.style.left = "10px";
                textCue.style.bottom = "80px";
                textCue.style.left = "10px";
                break;
            case "bottomright":
                chatBug.style.bottom = "10px";
                chatBug.style.right = "10px";
                textCue.style.bottom = "80px";
                textCue.style.right = "10px";
                break;
            case "bottommiddle":
                chatBug.style.bottom = "10px";
                chatBug.style.left = "50%";
                chatBug.style.transform = "translateX(-50%)";
                textCue.style.bottom = "80px";
                textCue.style.left = "50%";
                textCue.style.transform = "translateX(-50%)";
                break;
            case "middleright":
                chatBug.style.top = "50%";
                chatBug.style.right = "10px";
                chatBug.style.transform = "translateY(-50%)";
                textCue.style.top = "50%";
                textCue.style.right = "80px";
                textCue.style.transform = "translateY(-50%)";
                break;
            case "middleleft":
                chatBug.style.top = "50%";
                chatBug.style.left = "10px";
                chatBug.style.transform = "translateY(-50%)";
                textCue.style.top = "50%";
                textCue.style.left = "80px";
                textCue.style.transform = "translateY(-50%)";
                break;
            default:
                chatBug.style.bottom = "10px";
                chatBug.style.right = "10px";
                textCue.style.bottom = "80px";
                textCue.style.right = "10px";
                break;
        }

        var contentHeight;
        if (typeof innerCue.height !== 'undefined') {
            contentHeight = parseInt(innerCue.height) + 20;
        } else {
            contentHeight = parseInt(innerCue.clientHeight) + 20;
        }
        textCue.style.height = contentHeight + 'px';
        textCue.style.display = 'block';
    }

    function createTypingDiv() {
        TypingDiv = document.createElement('div');
        TypingDiv.style.display = 'flex';
        TypingDiv.style.justifyContent = 'flex-start';
        TypingDiv.style.alignItems = 'flex-start';
        TypingDiv.style.margin = '0';
        TypingDiv.style.padding = '0';
        TypingDiv.style.minHeight = '10px';

        var styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        styleSheet.innerHTML = `
            @keyframes zenzioTypingAnimation {
                0% {
                    transform: translateY(0px);
                    background-color: #86A3B8;
                }

                28% {
                    transform: translateY(-7px);
                    background-color: #F48484;
                }

                44% {
                    transform: translateY(0px);
                    background-color: #F55050;
                }
            }
        `;

        document.head.appendChild(styleSheet);

        function applyDotStyle(dot, time) {
            dot.style.backgroundColor = 'rgba(20,105,69,0.0)';
            dot.style.borderRadius = '50%';
            dot.style.height = '7px';
            dot.style.marginRight = '4px';
            dot.style.verticalAlign = 'middle';
            dot.style.width = '7px';
            dot.style.flexWrap = 'wrap';
            dot.style.animationDelay = time;
            dot.style.animation = 'zenzioTypingAnimation 1.8s infinite ease-in-out';
        }
        DotDiv1 = document.createElement('div');
        applyDotStyle(DotDiv1, '200ms');
        DotDiv2 = document.createElement('div');
        applyDotStyle(DotDiv2, '300ms');
        DotDiv3 = document.createElement('div');
        applyDotStyle(DotDiv3, '400ms');
        TypingDiv.appendChild(DotDiv1);
        TypingDiv.appendChild(DotDiv2);
        TypingDiv.appendChild(DotDiv3);

        return TypingDiv;
    }
    function ZenzioAddMessageBubble(message, source, messageid, CreatedUtc, isHidden = false, url = '', urltext = '', urlimage = '', setAsFirstChild = false) {
        text = getTimestampText(CreatedUtc)
        //console.log(text);
        ZenzioActiveInput = false;
        try {
            //find the whole chat container
            chatBox = document.getElementById('zenzioChatBox');
            //look for ChatMessage by id first, if null then create it
            var ChatMessage = document.getElementById(messageid);

            if (ChatMessage == null) {
                ChatMessage = document.createElement('div');

                if (urlimage != '') {
                    //add the image
                    var image = '<img src="' + urlimage + '" style="width:100%;height:120px;box-shadow: 0px 5px 15px -2px rgba(0,0,0,0.46);" alt="picture of inventory">';
                    message = message + '<br>' + image;
                }

                if (url != '') {
                    //add a link to the message
                    var linktoadd = '<br><a href="' + url + '" target="_blank">' + urltext + '</a>';
                }

                ChatMessage.appendChild(document.createTextNode(message)); // add the message
                if (url != '') ChatMessage.appendChild(linktoadd); // add the link if it exists


                ChatMessage.innerHTML = message;
                ChatMessage.id = messageid;

                if (ChatMessage.innerHTML == '##Thinking##') {
                    ChatMessage.innerHTML = "";
                    TypingDiv = createTypingDiv();
                    ChatMessage.appendChild(TypingDiv);

                }

                ChatMessage.style.backgroundColor = "#f2f2f2";
                ChatMessage.style.padding = "12px 16px";
                ChatMessage.style.borderRadius = "20px";
                ChatMessage.style.marginBottom = "8%";
                ChatMessage.style.animation = "fadeInChat 0.5s forwards";
                ChatMessage.style.wordWrap = "break-word";
                ChatMessage.style.maxWidth = "62%";
                ChatMessage.style.color = "black";
                ChatMessage.style.display = "inline-block";
                ChatMessage.style.boxSizing = "border-box";
                ChatMessage.style.alignItems = "flex-start";
                ChatMessage.style.flexWrap = "wrap";
                ChatMessage.style.fontSize = "15px";
                ChatMessage.style.lineHeight = "17px";


                if (source == "u") {
                    ChatMessage.style.alignSelf = 'flex-end';
                    ChatMessage.style.position = 'relative';
                    ChatMessage.style.display = 'inline';
                    ChatMessage.style.backgroundColor = '#111';
                    ChatMessage.style.borderBottomRightRadius = '2px';
                    ChatMessage.style.color = 'white';
                    ChatMessage.style.alignSelf = 'flex-end';
                    ChatMessage.style.marginRight = '16px';
                    ChatMessage.style.marginLeft = 'auto';
                }

                if (setAsFirstChild && chatBox.firstChild) {
                    // Insert the new div before the first child
                    chatBox.insertBefore(ChatMessage, chatBox.firstChild);
                } else {
                    // Append the new div as the only child
                    if (isHidden == false) {
                        chatBox.appendChild(ChatMessage);
                    }
                }

                ScrollToBottom('zenzioChatBox');


            }
            else {
                if (urlimage != '') {
                    var image = '<img src="' + urlimage + '" style="width:100%;height:120px;" alt="picture of inventory">';
                    message = message + '<br><br>' + image;
                }

                if (url != '') {
                    var linktoadd = '<br><a href="' + url + '" target="_blank">' + urltext + '</a>';

                    //message = message + '<br>' + linktoadd;
                }

                if (TypeWrtierActive === true) {
                    ZenzioActiveInput = true;
                    ChatMessage.innerHTML = "";
                    processHTML(message, ChatMessage, ChatMessage, null, 0, 0);
                }
                else if (TypeWrtierActive === false) {
                    //message exists so update it
                    ChatMessage.innerHTML = message;
                }
            }


            let datetimeDiv = document.createElement('div');
            datetimeDiv.style.fontSize = '12px';
            datetimeDiv.style.color = '#9c9c9c';
            datetimeDiv.style.position = 'absolute';
            datetimeDiv.style.right = '0';
            datetimeDiv.style.bottom = '-30px';
            datetimeDiv.style.marginBottom = '12px';
            var styleSheet = document.createElement('style');
            styleSheet.type = 'text/css';
            styleSheet.innerHTML = `
                @keyframes fadeInChat {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `;
            document.head.appendChild(styleSheet);
            datetimeDiv.style.animation = 'fadeInChat 2s forwards';

            datetimeDiv.innerText = text;
            let chatMessageWidth = ChatMessage.offsetWidth;
            datetimeDiv.setAttribute('data-createdUtc', CreatedUtc);

            if (chatMessageWidth > 100) {
                ChatMessage.appendChild(datetimeDiv);
            }


        } catch (e) {
            //problem
            console.log(e);
        }
    }



    function getTimestampText() {
        let currentTime = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate(), new Date().getUTCHours(), new Date().getUTCMinutes(), new Date().getUTCSeconds()));
        const chatMessages = document.querySelectorAll('.zenzioDate');  // Assuming every chat message has a 'zenzioDate' class for its timestamp.
        let textDate = "just now";
        chatMessages.forEach((timestampElem) => {
            const createdUtc = timestampElem.getAttribute('data-createdUtc');  // We'll store the createdUtc as an attribute to each timestamp div.
            // If no timestamp data, skip this iteration.
            ZenzioLogConsole("messagetimes", createdUtc)
            const createdDate = new Date(createdUtc);
            const differenceInMilliseconds = currentTime - createdDate;
            const differenceInMinutes = Math.floor(differenceInMilliseconds / (1000 * 60));

            if (differenceInMinutes < 2) {
                textDate = "just now";
            } else if (differenceInMinutes < 60) {
                textDate = differenceInMinutes + (differenceInMinutes > 1 ? " minutes ago" : " minute ago");
            } else {
                const differenceInHours = Math.floor(differenceInMilliseconds / (1000 * 60 * 60));
                if (differenceInHours < 24) {
                    textDate = differenceInHours + (differenceInHours >= 1 ? " hours ago" : " hour ago");
                }
                else if (differenceInHours > 24) {
                    textDate = "Previously";
                }
                else {
                    textDate = "";
                }
            }

            timestampElem.innerText = textDate;

        });
        return "";
    }

    function typeOutText(text, container, callback, typeSpeed = 10) {
        let charIndex = 0;
        let textNode = document.createTextNode("");
        container.appendChild(textNode);

        function typeChar() {
            if (charIndex < text.length) {
                textNode.data += text[charIndex++];
                setTimeout(typeChar, typeSpeed);
                ScrollToBottom('zenzioChatBox');
            } else if (callback) {
                callback();
            }
        }

        typeChar();
        ScrollToBottom('zenzioChatBox');
    }

    /*  Process HTML takes a string of html (ex: <p>Hello <strong>World!</strong></p>) and recursively parses it to type out each of the tags
        with the typeOutText function. */
    function processHTML(html, displayDiv, parentElement = displayDiv, callback, index = 0, level = 0) {
        if (index >= html.length) {
            if (callback) callback();
            return;
        }

        let startTagIndex = html.indexOf('<', index);
        if (startTagIndex !== -1 && startTagIndex > index) {
            let textContent = html.substring(index, startTagIndex);
            typeOutText(textContent, parentElement, () => {
                processTag(html, displayDiv, parentElement, callback, startTagIndex, level);
            });
        } else if (startTagIndex !== -1) {
            processTag(html, displayDiv, parentElement, callback, startTagIndex, level);
        } else {
            let textContent = html.substring(index);
            typeOutText(textContent, parentElement, callback);
        }
    }

    function processTag(html, displayDiv, parentElement, callback, startTagIndex, level) {
        let endTagIndex = html.indexOf('>', startTagIndex);
        if (endTagIndex === -1) {
            if (callback) callback();
            return;
        }

        let fullTag = html.substring(startTagIndex + 1, endTagIndex).trim();
        let isClosingTag = fullTag.startsWith('/');
        if (isClosingTag) {
            if (callback) callback();
            return;
        }

        let firstSpaceIndex = fullTag.indexOf(' ');
        let tagName = firstSpaceIndex !== -1 ? fullTag.substring(0, firstSpaceIndex) : fullTag;
        let element = document.createElement(tagName);
        if (tagName.toLowerCase() === 'a') {
            element.setAttribute('target', '_blank');
        }
        parentElement.appendChild(element);

        if (firstSpaceIndex !== -1) {
            let attributesString = fullTag.substring(firstSpaceIndex + 1);
            let attributePattern = /(\w+)(="[^"]*"|='[^']*'|=[^\s>]*)(?=\s|$)/g;
            let match;
            while ((match = attributePattern.exec(attributesString)) !== null) {
                let attrName = match[1];
                let attrValue = match[2].substring(2, match[2].length - 1);
                element.setAttribute(attrName, attrValue);
            }
        }

        let closingTag = `</${tagName}>`;
        let closingTagIndex = html.indexOf(closingTag, endTagIndex);
        if (closingTagIndex !== -1) {
            processHTML(html, displayDiv, element, () => {
                processHTML(html, displayDiv, parentElement, callback, closingTagIndex + closingTag.length, level);
            }, endTagIndex + 1, level + 1);
        } else {
            processHTML(html, displayDiv, parentElement, callback, endTagIndex + 1, level);
        }
    }

    function setupAbly() {
        if (!document.querySelector('script[src="https://cdn.ably.io/lib/ably.min-1.js"]')) {
            var script = document.createElement("script");
            script.src = "https://cdn.ably.io/lib/ably.min-1.js";
            script.onload = () => {
                ably = new Ably.Realtime('m3VFYA.rk_mwQ:3Hkaacg0-RVGQI5u-mPgGHUzBJll7dHaip2sbsLf0u8');

                var channel = ably.channels.get(channelid);
                channel.subscribe(function (message) {
                    // Handle received message
                    if (message.name === "chat_change") {
                        const chatChangePayload = JSON.parse(message.data);
                        if (chatChangePayload.ChatId == chatid) {
                            ZenzioAddMessageBubble(chatChangePayload.Message, chatChangePayload.Source.toLowerCase().trim(), chatChangePayload.MessageId, chatChangePayload.Created, chatChangePayload.hide, chatChangePayload.Url, chatChangePayload.UrlText, chatChangePayload.UrlImage);
                        }
                    }
                });
            };
            document.querySelector("body").appendChild(script);
        }
    }


    function ZenzioLogConsole(src, msg) {
        if (ZenzioDoDebug) {
            console.log(src + ': ' + msg);
        }
    }

    function createChatDisplay() {
        createChatContainer();
        createChatButton();
        createTextCue();
        createChatButtonImage();
        createChatBox();
        createChatInputContainer();
        createChatSendButton();
        createBottomTextContainer();
        createChatExpander();
    }

    function createChatButton() {
        ChatBugImageContainer = document.createElement("div");
        ChatBugImageContainer.id = "ZenzioChatBugIconContainer";
        ChatBugImageContainer.style.position = 'fixed';
        ChatBugImageContainer.style.bottom = '20px';
        ChatBugImageContainer.style.right = '20px';
        ChatBugImageContainer.style.zIndex = '9999';
        ChatBugImageContainer.style.borderRadius = '50%';
        ChatBugImageContainer.style.width = '60px';
        ChatBugImageContainer.style.height = '60px';
        ChatBugImageContainer.style.display = 'flex';
        ChatBugImageContainer.style.justifyContent = 'center';
        ChatBugImageContainer.style.alignItems = 'center';
        ChatBugImageContainer.style.fontSize = '30px';
    }

    function createTextCue() {
        ChatTextCue = document.createElement("div");
        ChatTextCue.id = "ZenzioChatTextCue";
        ChatTextCue.style.position = 'fixed';
        ChatTextCue.style.bottom = '90px';
        ChatTextCue.style.right = '20px';
        ChatTextCue.style.zIndex = '999999';
        ChatTextCue.style.backgroundColor = 'white';
        ChatTextCue.style.border = '1px solid #ddd';
        ChatTextCue.style.borderRadius = '5px';
        ChatTextCue.style.padding = '10px';
        ChatTextCue.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        ChatTextCue.style.display = 'none';
        ChatTextCue.style.maxWidth = '200px';
        ChatTextCue.style.wordWrap = 'break-word';
        ChatTextCue.style.overflowWrap = 'break-word';
        ChatTextCue.style.fontSize = '14px';
        ChatTextCue.style.lineHeight = '18px';

        createInnerTextCue();
        createTextCueClose();
    }

    function createInnerTextCue() {
        ChatTextCueInner = document.createElement("div");
        ChatTextCueInner.id = "ZenzioTextCueInner";
        ChatTextCueInner.style.marginLeft = '6px';
        ChatTextCueInner.style.marginRight = '6px';
        ChatTextCueInner.style.cursor = 'pointer';
        ChatTextCueInner.innerText = "Hi there, I am your AI Sales Associate! I am here to help you on your car buying journey";
        ChatTextCueInner.addEventListener('click', function () {
            ChatTextCue.style.display = "none";
            OpenChat();
        });
        ChatTextCue.appendChild(ChatTextCueInner);
    }

    function createTextCueClose() {
        var textCueClose = document.createElement("div");
        textCueClose.innerText = "X";
        textCueClose.style.position = 'absolute';
        textCueClose.style.right = '5px';
        textCueClose.style.top = '5px';
        textCueClose.style.cursor = 'pointer';
        textCueClose.style.fontSize = '20px';
        textCueClose.style.zIndex = '1000000';
        textCueClose.addEventListener('click', function () {
            ChatTextCue.style.display = "none";
            clicksCount++;
            writeOrUpdateCookie("clicksCount", clicksCount, baseExpirationDate);
        });
        ChatTextCue.appendChild(textCueClose);
    }

    function createChatButtonImage() {
        ChatBugImage = document.createElement('img');
        ChatBugImage.id = ChatBugImageId;
        ChatBugImage.style.width = '100%';
        ChatBugImage.style.height = '100%';
        ChatBugImage.style.borderRadius = '50%';

        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
            #${ChatBugImageId}:hover {
                cursor: pointer;
                background-color: rgba(0, 0, 0, 0.1);
            }
        `;
        document.head.appendChild(style);

        ChatBugImage.src = '##ChatBug_Base64##';

        ChatBugImage.alt = "Chat Icon";
        ChatBugImage.style.display = "none;"

        ChatBugImage.addEventListener('click', function () { OpenChat(); });
    }

    function createChatContainer() {
        ChatContainer = document.getElementById('ZenzioChatContainer') || createImportDiv();
        ChatContainer.id = "ZenzioChatContainer";

        ChatHeaderContainer = document.createElement('div');
        ChatHeaderContainer.style.backgroundColor = '#111';
        ChatHeaderContainer.style.color = 'white';
        ChatHeaderContainer.style.padding = '8px 16px 8px 16px';

        ShowHeader = document.createElement('div');
        ShowHeader.style.cursor = 'pointer';
        ShowHeader.style.display = 'flex';
        ShowHeader.style.flexWrap = 'wrap';
        ShowHeader.style.justifyContent = 'space-between';
        ShowHeader.style.textAlign = 'right';


        ShowNameai = document.createElement('div');
        ShowNameai.innerHTML = "<strong>AISA Chat</strong>"
        ShowHeader.appendChild(ShowNameai);

        ChatHeaderContainer.appendChild(ShowHeader);
        createCloseIcon();
        createChatWindow();
        ChatWindow.appendChild(ChatHeaderContainer);
    }

    function createImportDiv() {
        const importDiv = document.createElement('div');
        importDiv.id = 'ZenzioChatContainer';
        document.body.insertBefore(importDiv, document.body.firstChild);
        return importDiv;
    }

    function createCloseIcon() {
        CloseIcon = document.createElement('div');
        CloseIcon.innerText = "X";

        CloseIcon.style.position = 'absolute';
        CloseIcon.style.right = '16px';
        CloseIcon.style.fontSize = 'larger';
        CloseIcon.style.fontStretch = 'ultra-expanded';
        CloseIcon.style.top = '4px';
        CloseIcon.style.cursor = 'pointer';
        CloseIcon.style.backgroundRepeat = 'no-repeat';
        CloseIcon.style.backgroundPosition = 'center';
        CloseIcon.style.backgroundSize = 'contain';
        CloseIcon.style.width = '24px';
        CloseIcon.style.height = '24px';
        CloseIcon.style.color = '#fff';
        CloseIcon.style.zIndex = '9999';

        CloseIcon.addEventListener('click', async () => {
            try {
                await OpenChat();
                writeOrUpdateCookie(baseCookieName + locationid + "_manualclose", "oktest", baseExpirationDate);
            } catch (error) {
                console.error('Error opening chat:', error);
            }
        });

        ChatHeaderContainer.appendChild(CloseIcon);
    }

    function createChatWindow() {
        ChatWindow = document.createElement('div');
        ChatWindow.id = "zenzioChatWindow";

        ChatWindow.style.position = 'fixed';
        ChatWindow.style.borderRadius = '16px';
        ChatWindow.style.overflow = 'hidden';
        ChatWindow.style.margin = '20px';
        ChatWindow.style.paddingTop = '0';
        ChatWindow.style.display = 'none';
        ChatWindow.style.flexDirection = 'column';
        ChatWindow.style.height = '50%';
        ChatWindow.style.width = '20%';
        ChatWindow.style.right = '0';
        ChatWindow.style.zIndex = '9998';
        ChatWindow.style.transition = 'transform 0.5s ease';
        ChatWindow.style.bottom = '0';

        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
            @media (max-width: 768px) {
                #zenzioChatWindow {
                    width: 75%;
                }
            }
            @media (min-width: 769px) and (max-width: 1024px) {
                #zenzioChatWindow {
                    width: 50%;
                }
            }
        `;
        document.head.appendChild(style);

        ChatContainer.appendChild(ChatWindow);
    }

    function createChatBox() {
        ChatBox = document.createElement('div');
        ChatBox.id = 'zenzioChatBox';

        ChatBox.style.display = 'flex';
        ChatBox.style.flexDirection = 'column';
        ChatBox.style.background = '#FFF';
        ChatBox.style.width = '100%';
        ChatBox.style.zIndex = '9998';
        ChatBox.style.height = 'calc(100vh)';
        ChatBox.style.overflowWrap = 'normal';
        ChatBox.style.overflowY = 'auto';
        ChatBox.style.scrollbarWidth = 'thin';
        ChatBox.style.scrollbarColor = '#999999 #F5F5F5';
        ChatBox.style.marginRight = '10px';
        ChatBox.style.paddingTop = '10px';
        ChatBox.style.position = 'relative';

        ChatWindow.appendChild(ChatBox);
    }

    function createChatInputContainer() {
        ChatInputContainer = document.createElement('div');
        ChatInputContainer.id = "ZenzioChatInputContainer";

        ChatInputContainer.style.position = 'relative';
        ChatInputContainer.style.bottom = '0';
        ChatInputContainer.style.left = '0';
        ChatInputContainer.style.width = '100%';
        ChatInputContainer.style.padding = '16px';
        ChatInputContainer.style.backgroundColor = '#fff';
        ChatInputContainer.style.zIndex = '9999';
        ChatInputContainer.style.display = 'flex';
        ChatInputContainer.style.alignItems = 'center';
        ChatInputContainer.style.justifyContent = 'space-between';
        ChatInputContainer.style.paddingRight = '8px';
        ChatInputContainer.style.paddingBottom = '4px';
        ChatInputContainer.style.boxShadow = '0 0 50px 0 rgba(255, 255, 255, 1)';

        createChatInput();
    }

    function createChatInput() {
        Chatinput = document.createElement('textarea');
        Chatinput.id = 'zenzioChatInput';

        Chatinput.placeholder = 'Start Chat';
        Chatinput.style.height = '40px';

        var lastKeyPressed = "";

        Chatinput.addEventListener('keydown', async function (event) {
            if (event.key == "Enter") {
                await InputCheck();
            }
        });

        Chatinput.addEventListener('input', function () {
            this.style.height = (this.scrollHeight) + 'px';

            if (this.scrollHeight > 75) {
                this.style.borderRadius = '20px';
                ChatSendButton.style.top = "calc(100% - 35px)";
                ChatSendButton.style.transform = "none";

            } else {
                this.style.borderRadius = '50px';

                ChatSendButton.style.top = "60%";
                ChatSendButton.style.transform = "translateY(-50%)";
            }

            if (this.value.trim() !== "" && lastKeyPressed != "Enter") {
                ChatSendButton.style.filter = 'invert(35%) sepia(100%) saturate(3443%) hue-rotate(157deg) brightness(103%) contrast(104%)';
                Chatinput.style.boxShadow = '0 0 5px #019E87, 0 0 5px #019E87';

            } else if (lastKeyPressed != "Enter") {
                ChatSendButton.style.filter = '';
                ChatSendButton.style.top = "60%";
                ChatSendButton.style.transform = "translateY(-50%)";
                this.style.boxShadow = '';
                this.style.height = '40px';
            }

        });

        ChatInputContainer.appendChild(Chatinput);
        ChatWindow.appendChild(ChatInputContainer);
    }

    function createChatSendButton() {
        ChatSendButton = document.createElement('img');
        ChatSendButton.id = 'zenzioChatSendButton';

        ChatSendButton.style.position = 'absolute';
        ChatSendButton.style.right = '16px';
        ChatSendButton.style.top = "60%";
        ChatSendButton.style.transform = "translateY(-50%)";
        ChatSendButton.style.backgroundRepeat = 'no-repeat';
        ChatSendButton.style.backgroundPosition = 'center';
        ChatSendButton.style.backgroundSize = 'contain';
        ChatSendButton.style.width = '24px';
        ChatSendButton.style.height = '24px';
        ChatSendButton.style.marginLeft = '16px';
        ChatSendButton.style.cursor = 'pointer';
        ChatSendButton.style.border = 'none';
        ChatSendButton.style.outline = 'none';
        ChatSendButton.style.background = 'transparent';
        ChatSendButton.style.transition = '0.5s ease';

        ChatSendButton.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA5UlEQVR4nO3WMUpDQRSF4Q/UQhsRbKzdQMAFaCtqmTalYh9wATZuwMIt2FoGRJusIK0QSF4jdnaCXBGmsBFM4purkAN//V+GmTOXZRJzhCmecIGNWuIJ4gsNzrDWtji+YYxTrNQWR2GEboY4CkPsZ4ijMEAnQxx4xy12a4uj8IYb7MwjbhaUf/KKS2zOIj4uBRK/wAv6WJ9lgC3soYcr3JU2m2eAaemAVQtkGwc4xzXu8fzDAR6zxA9/8qhPsi5Xk/WcIqtA4r9U5qD2JzGs/S2Oai8C47ZXn0nWsndY5NXX22W0kQ875CXXn83dMgAAAABJRU5ErkJggg==';

        ChatSendButton.addEventListener('click', async () => {
            await InputCheck();
            if (window.innerWidth <= thresholdWidth) {
                ChatSendButton.style.display = "none";
            } else {
                ChatSendButton.style.display = "block";
            }
        });

        ChatInputContainer.appendChild(ChatSendButton);
    }

    function createBottomTextContainer() {
        bottomTextContainer = document.createElement('div');
        bottomTextContainer.style.position = 'relative';
        bottomTextContainer.style.margin = '0';
        bottomTextContainer.style.paddingTop = '0';
        bottomTextContainer.style.backgroundColor = '#fff';
        bottomTextContainer.style.zIndex = '9998';

        bottomText = document.createElement('div');

        bottomText.style.fontSize = '8px';
        bottomText.style.textAlign = 'center';
        bottomText.style.color = '#9c9c9c';
        bottomText.style.backgroundColor = '#fff';
        bottomText.style.marginTop = '0';
        bottomText.style.marginLeft = '20px';
        bottomText.style.marginRight = '10px';

        bottomText.innerHTML = "<span>Before proceeding, please take a moment to carefully read and understand our </span><a href='https://ai.zenzio.com/policy/terms.htm' target='_blank'><b>User Terms of Service</b></a><span> and </span><a href='https://ai.zenzio.com/policy/privacy.htm' target='_blank'><b>User Privacy Agreement</b></a><span>, as they contain important information about your rights and responsibilities, as well as how we handle your personal data.</span>";
        bottomTextContainer.appendChild(bottomText);
        ChatWindow.appendChild(bottomTextContainer);
    }

    function createChatExpander() {
        ChatExpanderContainer = document.createElement('div');
        ChatExpanderContainer.style.position = 'relative';
        ChatExpanderContainer.style.bottom = '0';
        ChatExpanderContainer.style.left = '0';
        ChatExpanderContainer.style.width = '100%';
        ChatExpanderContainer.style.padding = '6px';
        ChatExpanderContainer.style.paddingBottom = '4px';
        ChatExpanderContainer.style.paddingTop = '10px';
        ChatExpanderContainer.style.backgroundColor = '#fff';
        ChatExpanderContainer.style.zIndex = '9999';
        ChatExpanderContainer.style.display = 'flex';
        ChatExpanderContainer.style.alignContent = 'center';
        ChatExpanderContainer.style.marginRight = '8px';

        ChatExpander = document.createElement('div');
        ChatExpander.style.width = '100%';
        ChatExpander.style.height = '8px';
        ChatExpander.style.alignContent = 'center';
        ChatExpander.style.position = 'relative';
        ChatExpander.style.marginBottom = '4px';
        ChatExpander.style.backgroundColor = '#111';
        ChatExpander.style.borderRadius = '4px';
        ChatExpander.style.transition = 'background-color 0.3s';

        ChatExpanderContainer.appendChild(ChatExpander);
        ChatWindow.appendChild(ChatExpanderContainer);
    }

    /*  ZenzioAddBugImage generates the icon that you click on to open the chat, inside of here is also the generation of the text box that hovers above it, and the image
        that we store inside the icon. This also generates the chat box, TODO: Update naming of this function to better fit what it actually does */



    function parseApiValuesFromUrl() {
        const url = new URL(window.location.href);
        const queryParams = new URLSearchParams(url.search);
        var apiValues = {};
        queryParams.forEach((value, key) => {
            apiValues[key] = value;
        });

        return apiValues;
    }


    // Sets the text box innerHTML to a welcome message based on the VIN on the page if available.
    function GetVinData() {
        const vinRegex = new RegExp("\\b[A-Za-z0-9IOQioq_]{12}\\d{5}\\b");
        const elements = document.body.querySelectorAll('*');
        const nonScriptElements = Array.from(elements).filter(element => element.tagName !== 'SCRIPT');
        for (const element of nonScriptElements) {
            if (element.innerText != undefined) {
                const text = element.innerText;
                const found = text.match(vinRegex);
                if (found) {
                    if (!uniqueVins.has(found[0])) {
                        uniqueVins.add(found[0]);
                        foundVin = found[0];
                    }
                }
            }
        }
        if (uniqueVins.size > 0) {
            sendUserInformation();
        }

        if (uniqueVins.size == 1) {
            checkInventory().then(data => {
                if (data.length > 0) {
                    ChatTextCueInner.innerHTML = buildWelcomeString(data[0]);
                    vinFound = true;
                    vinid = foundVin;
                    WelcomeMessage = buildWelcomeString(data[0]);
                    var textCue = document.querySelector('.zenzioTextCue');
                    var innerCue = document.querySelector('.zenzioTextCueInner');
                    var contentHeight;
                    if (typeof innerCue.height !== 'undefined') {
                        contentHeight = parseInt(innerCue.height) + 20;
                    } else {
                        contentHeight = parseInt(innerCue.clientHeight) + 20;
                    }
                    textCue.style.height = contentHeight + 'px';
                    textCue.style.display = 'block';
                }
                else {
                    ChatTextCueInner.innerHTML = "Hi there, I am your AI Sales Associate! I am here to help you on your car buying journey";
                }
            }).catch((error) => {
                console.log(error.message);
                ChatTextCueInner.innerHTML = "Hi there, I am your AI Sales Associate! I am here to help you on your car buying journey";
            });
        }
        else if (uniqueVins.size > 1) {
            checkInventory().then(data => {
                // console.log(data);
            }).catch((error) => {
                console.log(error.message);
                ChatTextCueInner.innerHTML = "Hi there, I am your AI Sales Associate! I am here to help you on your car buying journey";
            })
        }
        else {
            ChatTextCueInner.innerHTML = "Hi there, I am your AI Sales Associate! I am here to help you on your car buying journey";
        }

    }

    async function sendUserInformation() {
        var vinQueryString = `vinNumbers=${encodeURIComponent(Array.from(uniqueVins).join(','))}`;

        chatid = await localStorage.getItem('ChatID');
        const url = `https://localhost:7077/api/VinInteraction?locationid=${locationid}&chatid=${chatid}&${vinQueryString}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': "##API_KEY##",
                    'X-Zenzio-Current-URL': window.location.href,
                    'X-Zenzio-Current-IP': await getClientIP()
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return;

        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);

        }
    }
    function buildWelcomeString(carInfo) {
        var string = 'Hi there, I am your AI Sales Associate! Are you interested in this ';
        string += carInfo.year + ' ' + carInfo.make + ' ' + carInfo.model + '? ';
        string += 'I am here to discuss more about this vehicle and answer any questions you may have.';

        return string;
    }

    //********************************** */
    // Checkes the inventory based on the vin number scraped from the page.
    //********************************** */
    async function checkInventory() {
        var vinQueryString = `vinNumbers=${encodeURIComponent(Array.from(uniqueVins).join(','))}`;
        const url = `https://localhost:7077/api/inventory?locationId=${locationid}&${vinQueryString}`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': "##API_KEY##"
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);

        }
    }

    self.TriggerOpenChat = async function () {
        OpenChat();
    }

    function removeFade(elements) {
        elements.forEach(element => {
            element.style.animation = '';
            element.style.animationDirection = '';
        })
    }

    function addHide(elements) {
        elements.forEach(element => {
            element.style.display = 'none';
        })
    }

    function removeHide(elements) {
 
        elements.forEach(element => {
            console.log(element);
            element.style.display = 'block';
        })
    }

    function addFadeOutIcon(elements) {
        elements.forEach(element => {
            element.style.animation = 'fadeOut 0.3s forwards';
            element.style.animationDirection = 'normal';
        });

        var styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        styleSheet.innerHTML = `
            @keyframes fadeOut {
               from {
                    right: 30%;
                }

                to {
                    right: 0%;
                }
            }
        `;
        document.head.appendChild(styleSheet);
    }

    function addFadeInIcon(elements) {
        elements.forEach(element => {
            element.style.animation = 'fadeIn 0.3s forwards';
            element.style.animationDirection = 'normal';
        });

        var styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        styleSheet.innerHTML = `
            @keyframes fadeIn {
                from {
                    right: 0%;
                }

                to {
                    right: 30%;
                }
            }
        `;
        document.head.appendChild(styleSheet);
    }

    function addFadeOutBox(elements) {
        elements.forEach(element => {
            element.style.animation = 'fadeOutBox 0.3s forwards';
            element.style.animationDirection = 'normal';
        });

        var styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        styleSheet.innerHTML = `
            @keyframes fadeOutBox {
                0% {
                    opacity: 1;
                }

                50% {
                    opacity: 0;
                    -webkit-transform: scale3d(.3, .3, .3);
                    transform: scale3d(.3, .3, .3);
                }

                100% {
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(styleSheet);
    }

    function addFadeInBox(elements) {
        elements.forEach(element => {
            element.style.animation = 'fadeInBox 0.3s forwards';
            element.style.animationDirection = 'normal';
        });

        var styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        styleSheet.innerHTML = `
            @keyframes fadeinBox {
                0% {
                    opacity: 0;
                    -webkit-transform: scale3d(.3, .3, .3);
                    transform: scale3d(.3, .3, .3);
                }

                100% {
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styleSheet);
    }


    async function OpenChat() {
        if (AblyEnabled == false) {
            setupAbly();
        }

        ZenzioNewChat = await CheckStorage();

        var iconElement = document.getElementById(ChatBugImageId);
        var chatBox = document.getElementById('zenzioChatWindow');
        var chatInput = document.getElementById('zenzioChatInput');

        if (ZenzioActiveChat) {
            removeFade([iconElement, chatBox, chatInput]);
            addFadeOutIcon([iconElement]);
            addFadeOutBox([chatBox, chatInput]);
            addHide([chatBox]);
            iconElement.style.display = 'block';
            document.getElementById(ChatBugImageContainerId).style.display = 'flex';

            ZenzioLogConsole('OpenChat', "chat is closed");

            ZenzioActiveChat = false;
            ZenzioActiveInput = false;
        }
        else {
            removeFade([iconElement, chatBox, chatInput]);
            addFadeInIcon([iconElement]);
            removeHide([chatBox]);

            addFadeInBox([chatBox, chatInput]);
            ZenzioActiveChat = true;

            StartChat();

            ZenzioLogConsole('OpenChat', "chat is open");

            document.getElementById(ChatBugImageContainerId).style.display = 'none';
            document.getElementById(ChatBugImageId).style.display = 'none';
            document.getElementById(ChatTextCueId).style.display = 'none'; // Do not make this reappear, if the chat has been opened it fulfilled it's purpose.
        }


        try {
            currUserIp = await getClientIP();
        } catch (e) {
            currUserIp = "";
        }
    }

    async function StartChat() {

        const Chatinput = document.getElementById('zenzioChatInput');

        await loadChat();

        /*        if (openedChatFirstTime == true && vinid != undefined) {
                    var message = "I am looking at the car with VIN number " + vinid;
                    SendMessage(message, true);
                    openedChatFirstTime = false;
                }*/

        Chatinput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.keyCode === 13) {
                ZenzioLogConsole('StartChat', 'Enter key was pressed.');

                if (ZenzioActiveInput) {
                    ZenzioActiveInput = false;
                    InputCheck(event);
                }
            }
        });
    }



    //********************************** */
    //********************************** */
    async function InputCheck(event) {
        const chatBox = document.getElementById('zenzioChatBox');
        const Chatinput = document.getElementById('zenzioChatInput');
        if (event && event.keyCode === 13) { // 13 is the keyCode for the "Enter" key
            event.preventDefault();
            Chatinput.style.height = '40px';
            Chatinput.style.borderRadius = '50px';
            Chatinput.style.boxShadow = '';
            ChatSendButton.style.filter = '';
            ChatSendButton.style.top = "60%";
            ChatSendButton.style.transform = "translateY(-50%)";
        }


        if (Chatinput.value != "") {

            if (Chatinput.value.includes('--reset--')) {
                //do a full reset
                await ResetStorage();
                await CheckStorage();
                await loadChat();

                //delete the cookie
                deleteCookie(baseCookieName + locationid + "_marker");
                deleteCookie(baseCookieName + locationid + "_manualclose");

                //clear it
                Chatinput.value = "";
                Chatinput.innerHTML = "";
            }
            else if (Chatinput.value.includes('--closechat--')) {
                //clear it
                Chatinput.value = "";
                Chatinput.innerHTML = "";
                ZenzioActiveChat = true;
                OpenChat();
            }
            else if (Chatinput.value.includes('--showapi--')) {
                var str = "";
                for (const key in urlValues) {
                    str += `${key}: ${urlValues[key]}\n`;
                }
                const messageid = await generateGUID();
                ZenzioAddMessageBubble(str, 'a', messageid, false, '', '', '', false);
            }
            else {
                var newmessage = Chatinput.value
                Chatinput.value = "";
                Chatinput.innerHTML = "";
                await SendMessage(newmessage);
            }
        }
        else {
            ZenzioActiveInput = true;
            Chatinput.value = "";
            Chatinput.innerHTML = "";
        }
    }

    async function SendMessage(Message) {
        chatid = localStorage.getItem('ChatID');
        messageid = await generateGUID();

        LastmessageTime = new Date().toUTCString();
        //console.log('RequestMessage')
        clicksCount = 0;
        writeCookie("clicksCount", clicksCount, baseExpirationDate);
        await UserRequest(chatid, locationid, messageid, Message, LastmessageTime);

    }


    async function UserRequest(chatid, locationid, messageid, Message, LastmessageTime) {
        while (true) {
            try {
                var url = `https://localhost:7077/OutBound/UserRequest?chatid=${chatid}&locationid=${locationid}&messageid=${messageid}&'&message=${encodeURIComponent(Message)}&messagetime=${LastmessageTime}`
                if (uniqueVins.size > 0) url += `&vinNumbers=${encodeURIComponent(Array.from(uniqueVins).join(','))}`

                const headers = new Headers();
                headers.append('X-Zenzio-Current-URL', window.location.href);
                headers.append('X-Zenzio-Current-IP', currUserIp);

                const response = await fetch(url, {
                    method: 'GET',
                    headers: headers,
                });

                break;
            } catch (error) {
                console.error(error);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    }

    async function CheckStorage() {
        chatid = await localStorage.getItem('ChatID');

        if (chatid == null) {
            await localStorage.removeItem('ChatID');
            var newGUID = await generateGUID();
            await localStorage.setItem('ChatID', newGUID);
            chatid = await localStorage.getItem('ChatID');
            createdUtc = await localStorage.getItem('createdUtc');
            ZenzioNewChat = true;
            ZenzioLogConsole('CheckStorage', 'Storage Created: New ChatId: ' + chatid);
            return true;
        }
        else {
            ZenzioLogConsole('CheckStorage', 'Loaded Storage ChatID: ' + chatid);
            return false;
        }

        var msgId = await generateGUID();
        ZenzioAddMessageBubble(chatid, 'a', msgId, createdUtc);
    }

    async function ResetStorage() {
        localStorage.removeItem('ChatID');

        const chatBox = document.getElementById('zenzioChatBox');
        while (chatBox.firstChild) {
            chatBox.removeChild(chatBox.firstChild);
        }
        ZenzioNewChat = CheckStorage(null);
    }

    async function loadChat() {
        try {
            const ChatID = await localStorage.getItem('ChatID');

            url = 'https://localhost:7077/OutBound/LoadChat?chatid=' + ChatID + '&locationid=' + locationid;
            const headers = new Headers();
            headers.append('X-Zenzio-Current-URL', window.location.href);
            headers.append('X-Zenzio-Current-IP', currUserIp);

            /*const response = await fetch(url);*/

            response = await fetch(url, {
                method: 'GET',
                headers: headers,
            });

            let chatBox = document.getElementById('zenzioChatBox');

            if (!response.ok) throw new Error('Error fetching data: ${response.statusText}');
            const ZenChatList = await response.json();
            //console.log('Number of Loaded Messages: ' + ZenChatList.messages.length);
            ZenzioActiveInput = false;
            chatBox.innerHTML = '';

            CheckWelcome();

            ZenChatList.messages.forEach((item) => {
                // console.log(item);
                ZenzioAddMessageBubble(item.msg, item.source, item.messageId, item.createdUtc, item.hide);
                if (item.source === 'a') ZenzioActiveInput = true;
            });
            if (ZenChatList.messages.length > 0) {
                openedChatFirstTime = false;
                ZenzioActiveInput = true;
            }

            setInterval(getTimestampText, 60 * 1000);
        } catch (error) {
            console.error(error);
            // Handle the error here
        }
    }

    function CheckWelcome() {
        try {
            var chatBox = document.getElementById("zenzioChatBox");

            // Check if any child of chatBox contains the WelcomeMessage
            var containsWelcome = [...chatBox.children].some(child => child.innerHTML === WelcomeMessage);

            if (!containsWelcome) {
                const messageid = generateGUID();
                let CreatedTime = new Date(Date.UTC(new Date().getUTCFullYear()));
                ZenzioAddMessageBubble(WelcomeMessage, 'a', messageid, CreatedTime, false, '', '', '', true);
            }
        } catch {
            // handle any error here
        }
    }

    async function generateGUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    function ScrollToBottom(elementName) {
        try {
            setTimeout(() => {
                const checkElement = () => {
                    const element = document.getElementById(elementName);
                    if (element) {
                        element.scrollTop = element.scrollHeight - element.clientHeight;
                    } else {
                        requestAnimationFrame(checkElement);
                    }
                };
                requestAnimationFrame(checkElement);
            }, 100);
        } catch
        {

        }
    };
    function writeOrUpdateCookie(name, value, expirationDate) {
        try {
            const existingCookie = getCookie(name);

            if (existingCookie) {
                updateCookie(name, value, expirationDate);
            } else {
                writeCookie(name, value, expirationDate);
            }
        } catch (error) {
            console.error("Error writing/updating cookie:", error);
        }
    }

    function getCookie(name) {
        try {
            const cookies = document.cookie.split("; ");
            for (const cookie of cookies) {
                const [cookieName, _] = cookie.split("=");
                if (cookieName === name) {
                    return cookie;
                }
            }
            return null;
        } catch (error) {
            console.error("Error getting cookie:", error);
            return null;
        }
    }

    function writeCookie(name, value, expirationDate) {
        try {
            const expires = expirationDate ? "; expires=" + expirationDate.toUTCString() : "";
            document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/`;
        } catch (error) {
            console.error("Error writing cookie:", error);
        }
    }

    function updateCookie(name, value, expirationDate) {
        try {
            deleteCookie(name);
            writeCookie(name, value, expirationDate);
        } catch (error) {
            console.error("Error updating cookie:", error);
        }
    }

    function deleteCookie(name) {
        try {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        } catch (error) {
            console.error("Error deleting cookie:", error);
        }
    }

    async function getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return null;
        }
    }

    function getClientDevice() {
        if (navigator.userAgent.match(/Android/i)
            || navigator.userAgent.match(/webOS/i)
            || navigator.userAgent.match(/iPhone/i)
            || navigator.userAgent.match(/iPad/i)
            || navigator.userAgent.match(/iPod/i)
            || navigator.userAgent.match(/BlackBerry/i)
            || navigator.userAgent.match(/Windows Phone/i)) {
            return true;
        }
        return false;
    }

    return self;
})();
