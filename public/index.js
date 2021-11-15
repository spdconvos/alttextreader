/** @format */

//Check fetch support
if (!fetch) {
    alert("Your browser is not supported");
}

let main = () => {
    //The main function that does everything
    //Have to grab some nodes, fuck jQuery
    const out = document.getElementById("out");
    const input = document.getElementById("link_input");
    const send = document.getElementById("post");
    const clear = document.getElementById("clear");

    let errorHandler = err => {
        console.group("%cError", "color:red");
        console.error(err);
        console.log(
            "%cPlease report a bug at https://github.com/spdconvos/alttextreader/",
            "color:blue"
        );
        console.groupEnd();

        let errorDuplication = {};
        for (let k in err) errorDuplication[k] = err[k];

        let options = {
            method: "POST",
            body: JSON.stringify({
                code: err.code,
            }),
            headers: {
                "content-type": "application/json",
            },
        };

        fetch("/error", options).catch(err => {
            console.error("Error in the error handler handling an error", err);
        });
    };

    let sendHandler = (event, statusID) => {
        //Send handler, handles sending stuff to the server
        if (!!event) event.preventDefault();

        //Clear the output
        while (out.lastChild) {
            out.removeChild(out.lastChild);
        }

        //Check for empty input
        if (input.value.length == 0 && statusID === undefined) {
            let element = document.createElement("div");
            element.innerText = "Enter a link!";
            element.className = "error";
            out.appendChild(element);
            return;
        }

        //Build the request basically
        let options = {
            method: "GET",
            headers: {
                "Content-Type": "text/plain",
            },
        };

        //Async fetch from the server
        fetch(
            "/alttext?" +
                new URLSearchParams({
                    link: input.value.length != 0 ? input.value : statusID,
                }),
            options
        )
            .then(resp => resp.json())
            .then(json => {
                //Check for errors
                if (json.hasOwnProperty("errors")) {
                    for (let entry of json.errors) {
                        let element = document.createElement("div");
                        element.innerText = entry;
                        element.className = "error";
                        out.appendChild(element);
                    }
                }

                //Go through all images and create elements for them
                //Could probably make it so all images decode at the same time instead, but shrug
                for (let image of json.images) {
                    let container = document.createElement("div");
                    container.className = "image_container";

                    let img = document.createElement("img");
                    img.src = image.src;
                    img.alt = image.text;
                    img.className = "image";

                    let label = document.createElement("div");
                    label.className = "alt";
                    label.innerText =
                        image.text !== null
                            ? image.text
                            : "No alt text embedded, pester the author to add alt text next time";

                    if (image.text == null) {
                        img.classList.add("no_alt");
                        label.classList.add("no_alt");
                    }

                    container.appendChild(img);
                    container.appendChild(label);

                    img.decode()
                        .then(() => {
                            out.appendChild(container);
                        })
                        .catch(err => {
                            if (err.name == "EncodingError") {
                                console.log(
                                    "Turn off strict content blocking for images!"
                                );
                                container.removeChild(img);
                                out.appendChild(container);
                            } else {
                                errorHandler(err);
                            }
                        });
                }
            })
            .catch(err => {
                errorHandler(err);
            });
    };

    //Add event handlers
    send.addEventListener("click", sendHandler);
    input.addEventListener("keyup", e => {
        if (e.key === "Enter") sendHandler(e);
    });
    clear.addEventListener("click", e => {
        e.preventDefault();

        //Clear the output
        while (out.lastChild) {
            out.removeChild(out.lastChild);
        }
    });

    if (window.location.pathname == "/results") {
        sendHandler(
            null,
            new URLSearchParams(window.location.search).get("id")
        );
    }
};

//Wait for shit to load, i hate the internet
document.addEventListener("DOMContentLoaded", main);
