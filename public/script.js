async function uploadFile() {
    const file = document.getElementById("fileInput").files[0];
    if (!file) return alert("Select a file!");

    const fileName = Date.now() + "_" + file.name;

    // 1. Get a presigned URL
    const signRes = await fetch(`/sign-put?file=${fileName}&type=${file.type}`);
    const { uploadURL } = await signRes.json();

    // 2. Upload directly to Backblaze
    await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
    });

    alert("Uploaded!");
    loadFiles();
}

// Load all files
async function loadFiles() {
    const res = await fetch("/list");
    const files = await res.json();

    const list = document.getElementById("fileList");
    list.innerHTML = "";

    for (const f of files) {
        const item = document.createElement("div");

        const viewURL = await fetch(`/signed-get?file=${f.Key}`).then(r => r.json());

        let display = "";

        if (f.Key.match(/\.(jpg|jpeg|png|gif)$/i)) {
            display = `<img src="${viewURL.viewURL}" width="200">`;
        } else if (f.Key.match(/\.(mp4|mov|webm)$/i)) {
            display = `<video width="200" controls src="${viewURL.viewURL}"></video>`;
        } else {
            display = `<a href="${viewURL.viewURL}" target="_blank">${f.Key}</a>`;
        }

        item.innerHTML = display;
        list.appendChild(item);
    }
}

loadFiles();
