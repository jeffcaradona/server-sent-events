




// Compose initialization
const onReady = () => {
  console.log("Initializing...");

  const evtSource = new EventSource("/sse/time");

  evtSource.onmessage = (event) => {
    const { utc } = JSON.parse(event.data);
    const local = new Date().toLocaleString();
    console.log(`Server UTC: ${utc} | Browser Local: ${local}`);
  };

  console.log("Document is ready!");
};

document.addEventListener("DOMContentLoaded", onReady);
