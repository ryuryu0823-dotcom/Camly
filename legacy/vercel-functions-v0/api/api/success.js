export default {
  async fetch(request) {
    const url = new URL(request.url);
    const session_id = url.searchParams.get("session_id");

    if (!session_id) {
      return new Response("session_id がありません", {
        status: 400,
      });
    }

    return new Response(
      JSON.stringify({
        message: "Camly success API is working!",
        session_id,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  },
};
