// Compose initialization
const onReady = () => {
  console.log("Initializing...");

  const evtSource = new EventSource("/sse/time");

  evtSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "shutdown") {
        console.log("Server is shutting down. Closing connection.");
        evtSource.close();
        // Optionally, update UI to inform user
    } else {
        // Handle normal time event
        const { utc } = data;
        const local = new Date().toLocaleString();
        console.log(`Server UTC: ${utc} | Browser Local: ${local}`);
    }
  };

  evtSource.onerror = function() {
    // Optionally handle connection errors
    console.log("Connection error or server offline.");
  };

  console.log("Document is ready!");
};

document.addEventListener("DOMContentLoaded", onReady);
