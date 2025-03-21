let zeitop = null;

let head = document.head;
// let app = document.getElementById("app");

function load_b64_ttf(font_family, b64) {
    let style = document.createElement("style");
    style.innerHTML = "@font-face {font-family: '" + font_family + "';src: url(data:font/truetype;charset=utf-8;base64," + b64 + ") format('truetype')}";
    head.appendChild(style);
}

function replace_with_page(element, page) {
    element.innerHTML = page.content;
    let style = document.createElement("style");
    style.innerHTML = page.style;
    head.appendChild(style);
    eval(page.script)
}

function onready(ws) {
    ws.request("page", "default", (reply) => {
        // console.log(reply)
        let default_page = JSON.parse(reply);
        // dbg(default_page);
        replace_with_page(app, default_page);
    });
}

document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
    zeitop = new Zeitop(device.serial, 6969, onready);
}

