const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function test() {
    console.log("Testing Live TV API...");
    try {
        const res = await fetch("https://dlhd.link/daddyapi.php?key=YOUR_KEY&endpoint=channels");
        console.log("Live TV status:", res.status);
        const data = await res.text();
        console.log("Live TV preview:", data.substring(0, 100));
    } catch (e) { console.error("Live TV Error:", e.message); }

    console.log("\nTesting Sports API...");
    try {
        const res = await fetch("https://streamed.pk/api/sports", {
            headers: { "User-Agent": "Mozilla/5.0 CStream/4.0" }
        });
        console.log("Sports status:", res.status);
        const data = await res.text();
        console.log("Sports preview:", data.substring(0, 100));
    } catch (e) { console.error("Sports Error:", e.message); }
}

test();
