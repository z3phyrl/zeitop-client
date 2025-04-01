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
    constructor(serial, port, onready, request_timeout) {
        this.ws = new WebSocket("ws://localhost:" + port);
        this.requests = new Map(); // (service?{::request}, callback)
        this.onready = onready;
        this.request_timeout = request_timeout || 5000; // millisecs
        this.autonum = new Map();
        let handler = (msg) => {
            if (msg.data == "?") {
                this.ws.send("?");
                return;
            }
            let data = msg.data;
            let at_index = data.indexOf("@");
            let tag_index = data.indexOf("#");
            if (tag_index > at_index || tag_index < 0) {tag_index = at_index}
            let data_index = data.indexOf("::", at_index);
            let parse = [data.slice(0, tag_index), data.slice(tag_index, at_index), data.slice(at_index + 1, data_index), data.slice(data_index + 2)];
            let request = parse[0];
            let tag = parse[1];
            let service = parse[2];
            let reply = parse[3];
            let callback = this.requests.get(service + tag);
            console.log(service + tag);
            if (callback == null) {
                callback = this.requests.get(service + "::" + request + tag);
            }
            let err = null;
            if (reply.startsWith("!")) {
                log(msg);
                err = reply;
                reply = null;
            }
            callback(reply, err);
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
    auto_num(service, tag) {
        let autonum_length = (tag.match(/#/g)||[]).length;
        let autonum = this.autonum.get(service) + 1 || 0;
        let num_length = autonum.toString().length;
        let pad = autonum_length - num_length;
        if (num_length > autonum_length) {this.autonum.set(service, 0)}
        else {this.autonum.set(service, autonum);}
        let res = tag.replace("#".repeat(autonum_length), "0".repeat(pad) + autonum);
        if (res === tag) {
            res = "error-" + "0".repeat(pad) + autonum;
            dbg("ERROR BAD TAG :: " + service + "#" + tag + " => #" + res);
        } 
        return res;
    }
    process_tag(service, tag) {
        if (tag.indexOf("#") > -1) {
            tag = "#" + this.auto_num(service, tag);
        } else if (tag) {
            tag = "#" + tag;
        } else if (tag === "") {
            tag = "#" + this.auto_num(service, "####");
        } else {
            tag = "";
        }
        return tag;
    }
    request(service, request, callback, tag, timeout) {
        tag = this.process_tag(service, tag);
        let request_timeout = timeout || this.request_timeout;
        if (this.requests.get(service)) {
            return false;
        } else {
            let timeout = setTimeout(() => {
                this.requests.delete((service + "::" + request))
            }, request_timeout);
            let remove_on_callback = (reply) => {
                clearTimeout(timeout);
                this.requests.delete((service + "::" + request))
                callback(reply)
            }
            this.requests.set((service + "::" + request + tag), remove_on_callback)
            this.ws.send("&" + service + tag + "::" + request)
            return true;
        }
    }
    subscribe(service, callback, tag) {
        tag = this.process_tag(service, tag);
        this.requests.set(service + tag, callback);
        this.ws.send("&" + service + tag)
    }
}

