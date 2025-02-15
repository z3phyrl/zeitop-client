let zeitop = null;

let head = document.head;
let app = document.getElementById("app");

function load_page(page) {
    app.innerHTML = page.content;
    let style = document.createElement("style");
    style.innerHTML = page.style;
    head.appendChild(style);
    eval(page.script)
}

function onready(ws) {
    ws.request("page", "default", (reply) => {
        console.log(reply)
        let default_page = JSON.parse(reply);
        dbg(default_page);
        load_page(default_page);
    });
}

document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
    zeitop = new Zeitop(device.serial, 6969, onready);
}

