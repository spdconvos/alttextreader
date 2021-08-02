let main = () => {
    //The main function that does everything
    //Have to grab some nodes, fuck jQuery
    const out = document.getElementById("out");
    const input = document.getElementById("link_input");
    const send = document.getElementById("post");
    const clear = document.getElementById("clear");

    let sendHandler = event => {
        //Send handler, handles sending stuff to the server
        event.preventDefault();

        //Clear the output
        while(out.lastChild) {
            out.removeChild(out.lastChild);
        }

        if (input.value.length == 0){
            let element = document.createElement("div");
            element.innerText = "Enter a link!"
            element.className = "error";
            out.appendChild(element);
            return;
        }

        let options = {
            method: "GET",
            headers: {
                'Content-Type': 'text/plain'
            }
        };

        fetch('/alttext?' + new URLSearchParams({
            link: input.value
        }), options).then(resp => resp.json()).then(json => {
            if (json.hasOwnProperty("errors")){
                for (let entry of json.errors){
                    let element = document.createElement("div");
                    element.innerText = entry;
                    element.className = "error";
                    out.appendChild(element);
                }
            }
                
            for (let image of json.images){
                let container = document.createElement("div")
                container.className = "image_container"

                let img = document.createElement("img")
                img.src = image.src;
                img.alt = image.text;
                img.className = "image";

                let label = document.createElement("div");
                label.className = "alt";
                label.innerText = (image.text !== null) ? image.text : "No alt text embedded, pester the author to add alt text next time";

                if (image.text == null){
                    img.classList.add("no_alt");
                    label.classList.add("no_alt");
                }

                container.appendChild(img)
                container.appendChild(label)

                img.decode().then(() => {
                    out.appendChild(container)
                })
            }
        }).catch(err => console.log(err));
    };

    send.addEventListener("click", sendHandler);
    input.addEventListener("keyup", e => {
        if (e.key === "Enter") sendHandler(e);
    });
    clear.addEventListener("click", e => {
        e.preventDefault();
        
        //Clear the output
        while(out.lastChild) {
            out.removeChild(out.lastChild);
        }
    });
}

document.addEventListener("DOMContentLoaded", main);