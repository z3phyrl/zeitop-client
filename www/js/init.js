let zeitop = null;

let body = document.body;
let head = document.head;

let app = document.getElementById("app");

function load_lib(name, callback) {
    callback = callback || (() => {});
    zeitop.request("lib", name, (lib) => {
        let script = document.createElement("script");
        script.innerHTML = lib;
        document.body.appendChild(script);
        callback();
    }, "");
}

function onready(ws) {
    load_lib("page", () => {
        request_page("default", (page) => {
            page.apply_style();
            page.append_to(app);
            page.init();
        });
    });
}

document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
    zeitop = new Zeitop(device.serial, 6969, onready);
}

