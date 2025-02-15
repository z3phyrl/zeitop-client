var dbg_console = document.getElementById("console");

function log(msg) {
    console.log(msg);
    let text = document.createTextNode(msg);
    let hr = document.createElement("hr");
    dbg_console.appendChild(text);
    dbg_console.appendChild(hr);
}

function dbg(obj) {
    log(JSON.stringify(obj));
}

class Zeitop {
    constructor(serial, port, onready) {
        this.ws = new WebSocket("ws://localhost:" + port);
        this.requests = new Map(); // (service?{::request}, callback)
        this.onready = onready;
        let handler = (msg) => {
            if (msg.data == "?") {
                this.ws.send("?");
                return;
            }
            if (msg.data.startsWith("!")) {
                log(msg.data);
                return;
            }
            let data = msg.data;
            let at_index = data.indexOf("@");
            let tag_index = data.indexOf("#");
            if (tag_index > at_index || tag_index < 0) {tag_index = at_index}
            let data_index = data.indexOf("::");
            let parse = [data.slice(0, tag_index), data.slice(tag_index + 1, at_index), data.slice(at_index + 1, data_index), data.slice(data_index + 2)];
            let request = parse[0];
            let tag = parse[1];
            let service = parse[2];
            let reply = parse[3];
            let callback = this.requests.get(service);
            if (callback == null) {
                callback = this.requests.get(service + "::" + request);
            }
            callback(reply);
        }
        let handshake = (msg) => {
            if (msg.data == "@Ok") {
                console.log("Deskr :: Connected")
                this.ws.removeEventListener("message", handshake);
                this.ws.addEventListener("message", handler)
                this.onready(this)
            }
        }
        this.ws.onopen = () => {
            this.ws.addEventListener("message", handshake);
            this.ws.send(serial)
        }
    }
    request(service, request, callback, tag) {
        if (tag == null) {
            tag = "";
        } else {
            tag = "#" + tag;
        }
        if (this.requests.get(service)) {
            return false;
        } else {
            let remove_on_callback = (reply) => {
                this.requests.delete((service + "::" + request))
                callback(reply)
            }
            this.requests.set((service + "::" + request), remove_on_callback)
            this.ws.send("&" + service + tag + "::" + request)
            return true;
        }
    }
    subscribe(service, callback) {
        this.requests.set(service, callback);
        this.ws.send("&" + service)
    }
}

